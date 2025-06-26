// Archivo AppContext.jsx - VERSIÓN FINAL, COMPLETA Y VERIFICADA

import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeData, saveData } from '@/lib/dataManager';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [colmados, setColmados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    clientes: [],
    creditos: [],
  });

  useEffect(() => {
    const data = initializeData();
    const creditosMigrados = (data.creditos || []).map(c => {
      if (c.capitalUtilizado === undefined && c.saldoDisponible !== undefined) {
        return { ...c, capitalUtilizado: c.montoAprobado - c.saldoDisponible, saldoDisponible: undefined };
      }
      return c;
    });
    setUsuarios(data.usuarios || []);
    setColmados(data.colmados || []);
    setClientes(data.clientes || []);
    setCreditos(creditosMigrados);
    setConsumos(data.consumos || []);
    setPagos(data.pagos || []);
    const loggedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (loggedUser) {
        setCurrentUser(loggedUser);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser || !clientes || !creditos) return;
    if (currentUser.role === 'administrador') {
      const todosLosCreditosConNombres = creditos.map(credito => {
          const cliente = clientes.find(c => c.id === credito.clienteId);
          return { ...credito, nombreCliente: cliente?.nombre || 'N/A' };
      });
      setDashboardData({ clientes, creditos: todosLosCreditosConNombres });
    } else if (currentUser.role === 'colmado') {
      const colmadoId = currentUser.colmadoId;
      const clientesVisibles = clientes.filter(c => c.colmadoId === colmadoId || c.esVip === true);
      const idsClientesVisibles = new Set(clientesVisibles.map(c => c.id));
      const creditosDeEsosClientes = creditos.filter(cr => idsClientesVisibles.has(cr.clienteId));
      setDashboardData({ clientes: clientesVisibles, creditos: creditosDeEsosClientes });
    }
  }, [currentUser, clientes, creditos]);

  const login = (username, password) => {
    const user = usuarios.find(u => u.username === username && u.password === password);
    if (!user) return null;
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };
  
  const viewAsColmadoUser = (colmadoId) => {
    const userToImpersonate = usuarios.find(u => u.role === 'colmado' && u.colmadoId === colmadoId);
    if (userToImpersonate) {
      sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
      setCurrentUser(userToImpersonate);
      return true;
    }
    alert('Este colmado no tiene un usuario asignado.');
    return false;
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
    if (userId === 'u1' || userId === 'admin1') {
      alert('No se puede eliminar al usuario administrador principal.');
      return;
    }
    const nuevosUsuarios = usuarios.filter(usuario => usuario.id !== userId);
    setUsuarios(nuevosUsuarios);
    saveData('usuarios', nuevosUsuarios);
    alert('Usuario eliminado correctamente.');
  };

  const aprobarCredito = (creditoId) => {
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, estado: 'activo', capitalUtilizado: 0, interesAdeudado: 0, fechaAprobacion: new Date().toISOString() } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
  };
  
  const registrarConsumo = (creditoId, montoConsumo, descripcion, colmadoId) => {
    const creditoAfectado = creditos.find(c => c.id === creditoId);
    if (!creditoAfectado) { alert("Error: Crédito no encontrado."); return; }
    const saldoDisponible = creditoAfectado.montoAprobado - (creditoAfectado.capitalUtilizado || 0);
    if (saldoDisponible < montoConsumo) {
      alert(`Saldo insuficiente.`);
      return;
    }
    const interesGenerado = montoConsumo * (creditoAfectado.tasaInteres || 0.15);
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, capitalUtilizado: (c.capitalUtilizado || 0) + montoConsumo, interesAdeudado: (c.interesAdeudado || 0) + interesGenerado } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    const nuevoConsumo = { 
        id: `cons-${Date.now()}`, creditoId, monto: montoConsumo, interesGenerado, 
        descripcion, fecha: new Date().toISOString(), colmadoId: colmadoId 
    };
    const nuevosConsumos = [...consumos, nuevoConsumo];
    setConsumos(nuevosConsumos);
    saveData('consumos', nuevosConsumos);
    alert(`Consumo de $${montoConsumo.toLocaleString()} registrado con éxito.`);
  };
  
  const registrarPago = (creditoId, montoPagado, colmadoId) => {
    const creditoOriginal = creditos.find(c => c.id === creditoId);
    if (!creditoOriginal) { alert("Error: No se pudo encontrar el crédito."); return; }
    const interesPendiente = creditoOriginal.interesAdeudado || 0;
    const pagoAInteres = Math.min(montoPagado, interesPendiente);
    const pagoACapital = montoPagado - pagoAInteres;
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, capitalUtilizado: (c.capitalUtilizado || 0) - pagoACapital, interesAdeudado: (c.interesAdeudado || 0) - pagoAInteres } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    const nuevoPago = { 
        id: `pago-${Date.now()}`, creditoId, montoTotal: montoPagado, montoInteres: pagoAInteres, 
        montoCapital: pagoACapital, fecha: new Date().toISOString(), colmadoId: colmadoId
    };
    const nuevosPagos = [...pagos, nuevoPago];
    setPagos(nuevosPagos);
    saveData('pagos', nuevosPagos);
    alert(`Pago de $${montoPagado.toLocaleString()} registrado con éxito.`);
  };
  
  const solicitarCredito = (solicitud) => {
    const nuevoCredito = { id: `cred-${Date.now()}`, ...solicitud };
    const nuevosCreditos = [...creditos, nuevoCredito];
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
  };
  
  const crearClienteYsolicitarCredito = (data) => {
    const nuevoCliente = { id: `cli-${Date.now()}`, nombre: data.nombre, cedula: data.cedula, direccion: data.direccion, telefono: data.contacto, colmadoId: data.colmadoId, esVip: false };
    const nuevosClientes = [...clientes, nuevoCliente];
    setClientes(nuevosClientes);
    saveData('clientes', nuevosClientes);
    const solicitud = { 
        clienteId: nuevoCliente.id, colmadoId: data.colmadoId, montoAprobado: data.montoCredito, estado: 'pendiente', 
        fechaSolicitud: new Date().toISOString(), tasaInteres: 0.15, capitalUtilizado: 0, interesAdeudado: 0,
    };
    solicitarCredito(solicitud);
    alert('Solicitud de crédito enviada para aprobación.');
  };

  const adminCrearClienteYCredito = (data) => {
    const nuevoCliente = {
      id: `cli-${Date.now()}`, nombre: data.nombre, cedula: data.cedula, direccion: data.direccion, 
      telefono: data.telefono, esVip: data.esVip || false, colmadoId: data.esVip ? null : null
    };
    const nuevosClientes = [...clientes, nuevoCliente];
    setClientes(nuevosClientes);
    saveData('clientes', nuevosClientes);
    const creditoData = {
      clienteId: nuevoCliente.id, colmadoId: null, montoAprobado: data.monto, capitalUtilizado: 0, 
      interesAdeudado: 0, tasaInteres: 0.15, estado: 'activo', 
      fechaSolicitud: new Date().toISOString(), fechaAprobacion: new Date().toISOString(),
    };
    solicitarCredito(creditoData);
    alert(`Cliente "${data.nombre}" creado con éxito.`);
  };

  const editarCliente = (clienteId, datosActualizados) => {
    const nuevosClientes = clientes.map(cliente => {
        if (cliente.id === clienteId) {
            return { ...cliente, ...datosActualizados };
        }
        return cliente;
    });
    setClientes(nuevosClientes);
    saveData('clientes', nuevosClientes);
    alert('Cliente actualizado con éxito.');
  };

  const eliminarCliente = (clienteId) => {
    const creditoCliente = creditos.find(c => c.clienteId === clienteId);
    if (creditoCliente) {
        const tieneDeuda = (creditoCliente.capitalUtilizado || 0) > 0.01 || (creditoCliente.interesAdeudado || 0) > 0.01;
        if (tieneDeuda) {
            alert('No se puede eliminar un cliente con una deuda pendiente. El cliente debe saldar su cuenta primero.');
            return false;
        }
    }
    const nuevosClientes = clientes.filter(c => c.id !== clienteId);
    const nuevosCreditos = creditos.filter(c => c.clienteId !== clienteId);
    setClientes(nuevosClientes);
    setCreditos(nuevosCreditos);
    saveData('clientes', nuevosClientes);
    saveData('creditos', nuevosCreditos);
    alert('Cliente eliminado con éxito.');
    return true;
  };

  const generarReporte = ({ tipoReporte, colmadoId, dateRange, searchTerm }) => {
    const { from, to } = dateRange;
    if (!from || !to) { return null; }
    const fechaInicio = new Date(from);
    const fechaFin = new Date(to);
    fechaFin.setHours(23, 59, 59, 999);
    
    switch (tipoReporte) {
      case 'consumos_clientes': {
        const consumosDelColmado = consumos.filter(cons => {
            if (!cons.fecha || !cons.colmadoId) return false;
            const fechaConsumo = new Date(cons.fecha);
            return cons.colmadoId === colmadoId && fechaConsumo >= fechaInicio && fechaConsumo <= fechaFin;
        });
        return consumosDelColmado.map(cons => {
            const credito = creditos.find(cr => cr.id === cons.creditoId);
            const cliente = clientes.find(cli => cli.id === credito?.clienteId);
            return { ...cons, nombreCliente: cliente?.nombre || "N/A" };
        });
      }
      case 'ganancias_colmado': {
        const pagosDelColmado = pagos.filter(pago => {
            if (!pago.fecha || !pago.colmadoId) return false;
            const fechaPago = new Date(pago.fecha);
            return pago.colmadoId === colmadoId && fechaPago >= fechaInicio && fechaPago <= fechaFin;
        });
        const interesTotal = pagosDelColmado.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);
        return { 
            pagos: pagosDelColmado, 
            interesTotal, 
            ganancia: interesTotal * 0.035 
        };
      }
      case 'estado_cuenta_cliente': {
        if (!searchTerm || searchTerm.trim() === '') { alert("Por favor, ingrese un nombre para buscar."); return null; }
        const busqueda = searchTerm.toLowerCase().trim();
        const misClientesVisibles = clientes.filter(c => c.colmadoId === colmadoId || c.esVip === true);
        const clienteEncontrado = misClientesVisibles.find(c => c.nombre.toLowerCase().includes(busqueda));
        if (!clienteEncontrado) { alert(`No se encontró cliente con el nombre "${searchTerm}".`); return null; }
        
        const creditoCliente = creditos.find(cr => cr.clienteId === clienteEncontrado.id);
        if (!creditoCliente) { return { cliente: clienteEncontrado, consumos: [], pagos: [] }; }
        
        const consumosCliente = consumos.filter(cons => {
            if (!cons.fecha || !cons.colmadoId) return false;
            const fechaConsumo = new Date(cons.fecha);
            return cons.creditoId === creditoCliente.id && cons.colmadoId === colmadoId && fechaConsumo >= fechaInicio && fechaConsumo <= fechaFin;
        });
        
        const pagosCliente = pagos.filter(pago => {
            if (!pago.fecha || !pago.colmadoId) return false;
            const fechaPago = new Date(pago.fecha);
            return pago.creditoId === creditoCliente.id && pago.colmadoId === colmadoId && fechaPago >= fechaInicio && fechaPago <= fechaFin;
        });
        
        return { cliente: clienteEncontrado, credito: creditoCliente, consumos: consumosCliente, pagos: pagosCliente };
      }
      default: return null;
    }
  };

  const value = { 
    currentUser, isLoading, dashboardData,
    usuarios, colmados, clientes, creditos, consumos, pagos,
    login, logout, viewAsColmadoUser,
    aprobarCredito, registrarConsumo, solicitarCredito, registrarPago, 
    crearClienteYsolicitarCredito, agregarColmado, editarColmado, 
    eliminarColmado, agregarUsuario, editarUsuario, eliminarUsuario, 
    generarReporte, adminCrearClienteYCredito,
    editarCliente, eliminarCliente
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) { throw new Error('useAppContext must be used within an AppProvider'); }
  return context;
};


