import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeData, saveData } from '../lib/dataManager';

const AppContext = createContext();

const formatDateToYMD = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput.toString().replace(/-/g, '/'));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AppProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [colmados, setColmados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = initializeData();
    
    // Transición de modelo de datos: si los datos viejos usan 'saldoDisponible', se convierte a 'capitalUtilizado'
    const creditosMigrados = data.creditos.map(c => {
      if (c.capitalUtilizado === undefined && c.saldoDisponible !== undefined) {
        return { ...c, capitalUtilizado: c.montoAprobado - c.saldoDisponible };
      }
      return c;
    });

    setUsuarios(data.usuarios);
    setColmados(data.colmados);
    setClientes(data.clientes);
    setCreditos(creditosMigrados);
    setConsumos(data.consumos);
    setPagos(data.pagos);
    const loggedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (loggedUser) {
        setCurrentUser(loggedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (username, password, colmadoId = null) => {
    const user = usuarios.find(u => u.username === username && u.password === password);
    if (!user) return null;
    if (user.role === 'colmado' && user.colmadoId !== colmadoId) return null;
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };

  const aprobarCredito = (creditoId) => {
    const nuevosCreditos = creditos.map(c => 
      c.id === creditoId 
      ? { ...c, estado: 'activo', capitalUtilizado: 0, interesAdeudado: 0, fechaAprobacion: new Date().toISOString() } 
      : c
    );
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
  };
  
  const registrarConsumo = (creditoId, montoConsumo, descripcion) => {
    const creditoAfectado = creditos.find(c => c.id === creditoId);
    if (!creditoAfectado) { alert("Error: Crédito no encontrado."); return; }
    
    const saldoDisponible = creditoAfectado.montoAprobado - (creditoAfectado.capitalUtilizado || 0);
    if (saldoDisponible < montoConsumo) {
      alert(`Saldo insuficiente. Límite de compra disponible: $${saldoDisponible.toLocaleString()}`);
      return;
    }

    const interesGenerado = montoConsumo * (creditoAfectado.tasaInteres || 0.15);
    
    const nuevosCreditos = creditos.map(c => 
      c.id === creditoId 
      ? { 
          ...c, 
          capitalUtilizado: (c.capitalUtilizado || 0) + montoConsumo,
          interesAdeudado: (c.interesAdeudado || 0) + interesGenerado 
        } 
      : c
    );
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);

    const nuevoConsumo = { id: `cons-${Date.now()}`, creditoId, monto: montoConsumo, interesGenerado, descripcion, fecha: new Date().toISOString() };
    const nuevosConsumos = [...consumos, nuevoConsumo];
    setConsumos(nuevosConsumos);
    saveData('consumos', nuevosConsumos);
    alert(`Consumo de $${montoConsumo.toLocaleString()} registrado con éxito.`);
  };
  
  const registrarPago = (creditoId, montoPagado) => {
    const creditoOriginal = creditos.find(c => c.id === creditoId);
    if (!creditoOriginal) { alert("Error: No se pudo encontrar el crédito."); return; }

    const interesPendiente = creditoOriginal.interesAdeudado || 0;
    const pagoAInteres = Math.min(montoPagado, interesPendiente);
    const pagoACapital = montoPagado - pagoAInteres;
    
    const nuevosCreditos = creditos.map(c => 
      c.id === creditoId 
      ? { 
          ...c, 
          capitalUtilizado: (c.capitalUtilizado || 0) - pagoACapital,
          interesAdeudado: (c.interesAdeudado || 0) - pagoAInteres
        } 
      : c
    );
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    
    const nuevoPago = { id: `pago-${Date.now()}`, creditoId, montoTotal: montoPagado, montoInteres: pagoAInteres, montoCapital: pagoACapital, fecha: new Date().toISOString() };
    const nuevosPagos = [...pagos, nuevoPago];
    setPagos(nuevosPagos);
    saveData('pagos', nuevosPagos);
    alert(`Pago de $${montoPagado.toLocaleString()} registrado con éxito.`);
  };
  
  // (El resto de las funciones no necesitan cambios, las incluyo por completitud)
  const solicitarCredito = (solicitud) => {
    const nuevoCredito = { id: `cred-${Date.now()}`, clienteId: solicitud.clienteId, colmadoId: solicitud.colmadoId, montoAprobado: solicitud.monto, capitalUtilizado: 0, interesAdeudado: 0, fechaSolicitud: new Date().toISOString(), estado: 'pendiente', tasaInteres: 0.15 };
    const nuevosCreditos = [...creditos, nuevoCredito];
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    alert('Solicitud de crédito enviada para aprobación.');
  };
  const crearClienteYsolicitarCredito = (data) => {
    const nuevoCliente = { id: `cli-${Date.now()}`, nombre: data.nombre, cedula: data.cedula, direccion: data.direccion, telefono: data.contacto, colmadoId: data.colmadoId };
    const nuevosClientes = [...clientes, nuevoCliente];
    setClientes(nuevosClientes);
    saveData('clientes', nuevosClientes);
    const solicitud = { clienteId: nuevoCliente.id, colmadoId: data.colmadoId, monto: data.montoCredito };
    solicitarCredito(solicitud);
  };
  const agregarColmado = (nuevoColmadoData) => {
    const nuevoColmado = { id: `c-${Date.now()}`, ...nuevoColmadoData };
    const nuevosColmados = [...colmados, nuevoColmado];
    setColmados(nuevosColmados);
    saveData('colmados', nuevosColmados);
    alert(`Colmado "${nuevoColmado.nombre}" agregado con éxito.`);
  };
  const editarColmado = (colmadoId, datosActualizados) => {
    const nuevosColmados = colmados.map(c => c.id === colmadoId ? { ...c, ...datosActualizados } : c);
    setColmados(nuevosColmados);
    saveData('colmados', nuevosColmados);
    alert('Colmado actualizado correctamente.');
  };
  const eliminarColmado = (colmadoId) => {
    const tieneCreditos = creditos.some(c => c.colmadoId === colmadoId);
    const tieneUsuarios = usuarios.some(u => u.colmadoId === colmadoId);
    if (tieneCreditos || tieneUsuarios) {
      alert('No se puede eliminar este colmado porque tiene usuarios o créditos asociados.');
      return;
    }
    const nuevosColmados = colmados.filter(c => c.id !== colmadoId);
    setColmados(nuevosColmados);
    saveData('colmados', nuevosColmados);
    alert('Colmado eliminado correctamente.');
  };
  const agregarUsuario = (nuevoUsuarioData) => {
    const nuevoUsuario = { id: `user-${Date.now()}`, ...nuevoUsuarioData };
    const nuevosUsuarios = [...usuarios, nuevoUsuario];
    setUsuarios(nuevosUsuarios);
    saveData('usuarios', nuevosUsuarios);
    alert(`Usuario "${nuevoUsuario.username}" agregado con éxito.`);
  };
  const editarUsuario = (userId, datosActualizados) => {
    const nuevosUsuarios = usuarios.map(usuario => usuario.id === userId ? { ...usuario, ...datosActualizados } : usuario);
    setUsuarios(nuevosUsuarios);
    saveData('usuarios', nuevosUsuarios);
    alert('Usuario actualizado correctamente.');
  };
  const eliminarUsuario = (userId) => {
    if (userId === 'u1') {
      alert('No se puede eliminar al usuario administrador principal.');
      return;
    }
    const nuevosUsuarios = usuarios.filter(usuario => usuario.id !== userId);
    setUsuarios(nuevosUsuarios);
    saveData('usuarios', nuevosUsuarios);
    alert('Usuario eliminado correctamente.');
  };
  const viewAsColmadoUser = (colmadoId) => {
    const userToImpersonate = usuarios.find(u => u.role === 'colmado' && u.colmadoId === colmadoId);
    if (userToImpersonate) {
      setCurrentUser(userToImpersonate);
      return true;
    }
    alert('Este colmado no tiene un usuario asignado para poder ver su dashboard.');
    return false;
  };
  const generarReporte = ({ tipoReporte, colmadoId, dateRange, searchTerm }) => {
    const { from, to } = dateRange;
    const startYMD = formatDateToYMD(from);
    const endYMD = formatDateToYMD(to);
    const creditosDelColmado = creditos.filter(c => c.colmadoId === colmadoId);
    const idsDeCreditos = creditosDelColmado.map(c => c.id);
    const parseDate = (dateString) => {
      if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(dateString.replace(/-/g, '/'));
      }
      return new Date(dateString);
    };
    switch (tipoReporte) {
      case 'consumos_clientes': return consumos.filter(cons => idsDeCreditos.includes(cons.creditoId) && parseDate(cons.fecha) >= new Date(startYMD) && parseDate(cons.fecha) <= new Date(endYMD)).map(cons => ({ ...cons, nombreCliente: clientes.find(cli => cli.id === creditos.find(cr => cr.id === cons.creditoId)?.clienteId)?.nombre || "N/A" }));
      case 'ganancias_colmado': { const pagosDelColmado = pagos.filter(pago => idsDeCreditos.includes(pago.creditoId) && parseDate(pago.fecha) >= new Date(startYMD) && parseDate(pago.fecha) <= new Date(endYMD)); const interesTotal = pagosDelColmado.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0); return { pagos: pagosDelColmado, interesTotal, ganancia: interesTotal * 0.035 }; }
      case 'estado_cuenta_cliente': { const clienteEncontrado = clientes.find(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase())); if (!clienteEncontrado) return null; const creditoCliente = creditos.find(cr => cr.clienteId === clienteEncontrado.id); if (!creditoCliente) return { cliente: clienteEncontrado, consumos: [], pagos: [] }; const consumosCliente = consumos.filter(cons => cons.creditoId === creditoCliente.id && parseDate(cons.fecha) >= new Date(startYMD) && parseDate(cons.fecha) <= new Date(endYMD)); const pagosCliente = pagos.filter(pago => pago.creditoId === creditoCliente.id && parseDate(pago.fecha) >= new Date(startYMD) && parseDate(pago.fecha) <= new Date(endYMD)); return { cliente: clienteEncontrado, credito: creditoCliente, consumos: consumosCliente, pagos: pagosCliente }; }
      default: return null;
    }
  };

  const value = { usuarios, colmados, clientes, creditos, consumos, pagos, currentUser, isLoading, login, logout, aprobarCredito, registrarConsumo, solicitarCredito, registrarPago, crearClienteYsolicitarCredito, agregarColmado, editarColmado, eliminarColmado, agregarUsuario, editarUsuario, eliminarUsuario, viewAsColmadoUser, generarReporte };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) { throw new Error('useAppContext must be used within an AppProvider'); }
  return context;
};