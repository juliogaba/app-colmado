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
    setUsuarios(data.usuarios);
    setColmados(data.colmados);
    setClientes(data.clientes);
    setCreditos(data.creditos);
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
  
  // --- NUEVA FUNCIÓN PARA "VER COMO" UN USUARIO DE COLMADO ---
  const viewAsColmadoUser = (colmadoId) => {
    // Encuentra el primer usuario asociado a ese colmado
    const userToImpersonate = usuarios.find(u => u.role === 'colmado' && u.colmadoId === colmadoId);

    if (userToImpersonate) {
      // Simula el inicio de sesión para ese usuario SIN tocar localStorage
      setCurrentUser(userToImpersonate);
      return true;
    }

    alert('Este colmado no tiene un usuario asignado para poder ver su dashboard.');
    return false;
  };

  const aprobarCredito = (creditoId) => {
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, estado: 'activo', saldoDisponible: c.montoAprobado, fechaAprobacion: new Date().toISOString() } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
  };

  const registrarConsumo = (creditoId, montoConsumo, descripcion) => {
    const creditoAfectado = creditos.find(c => c.id === creditoId);
    if (!creditoAfectado) { alert("Error: Crédito no encontrado."); return; }
    const interesGenerado = montoConsumo * (creditoAfectado.tasaInteres || 0.15);
    const totalADebitar = montoConsumo + interesGenerado;
    if (creditoAfectado.saldoDisponible < totalADebitar) {
      alert(`Saldo insuficiente.`);
      return;
    }
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, saldoDisponible: c.saldoDisponible - totalADebitar, interesAdeudado: (c.interesAdeudado || 0) + interesGenerado } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    const nuevoConsumo = { id: `cons-${Date.now()}`, creditoId, monto: montoConsumo, interesGenerado, totalDebitado: totalADebitar, descripcion, fecha: new Date().toISOString() };
    const nuevosConsumos = [...consumos, nuevoConsumo];
    setConsumos(nuevosConsumos);
    saveData('consumos', nuevosConsumos);
    alert(`Consumo de $${montoConsumo.toLocaleString()} registrado con éxito.`);
  };
  
  const registrarPago = (creditoId, montoPagado) => {
    let creditoOriginal = creditos.find(c => c.id === creditoId);
    if (!creditoOriginal) { alert("Error: No se pudo encontrar el crédito."); return; }
    let interesPendiente = creditoOriginal.interesAdeudado || 0;
    let pagoAInteres = Math.min(montoPagado, interesPendiente);
    let pagoACapital = montoPagado - pagoAInteres;
    const nuevosCreditos = creditos.map(c => c.id === creditoId ? { ...c, saldoDisponible: Math.min(c.saldoDisponible + pagoACapital, c.montoAprobado), interesAdeudado: c.interesAdeudado - pagoAInteres } : c);
    setCreditos(nuevosCreditos);
    saveData('creditos', nuevosCreditos);
    const nuevoPago = { id: `pago-${Date.now()}`, creditoId, montoTotal: montoPagado, montoInteres: pagoAInteres, montoCapital: pagoACapital, fecha: new Date().toISOString() };
    const nuevosPagos = [...pagos, nuevoPago];
    setPagos(nuevosPagos);
    saveData('pagos', nuevosPagos);
    alert(`Pago de $${montoPagado.toLocaleString()} registrado con éxito.`);
  };

  const solicitarCredito = (solicitud) => {
    const nuevoCredito = { id: `cred-${Date.now()}`, clienteId: solicitud.clienteId, colmadoId: solicitud.colmadoId, montoAprobado: solicitud.monto, saldoDisponible: 0, fechaSolicitud: new Date().toISOString(), estado: 'pendiente', tasaInteres: 0.15, interesAdeudado: 0 };
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
    const nuevosColmados = colmados.map(c => 
      c.id === colmadoId ? { ...c, ...datosActualizados } : c
    );
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

  const agregarUsuario = (nuevoUsuarioData) => { /* ... */ };
  const editarUsuario = (userId, datosActualizados) => { /* ... */ };
  const eliminarUsuario = (userId) => { /* ... */ };
  const generarReporte = ({ tipoReporte, colmadoId, dateRange, searchTerm }) => { /* ... */ };

  const value = { 
    usuarios, colmados, clientes, creditos, consumos, pagos, currentUser, isLoading, 
    login, logout, aprobarCredito, registrarConsumo, solicitarCredito, registrarPago, 
    crearClienteYsolicitarCredito, agregarUsuario, generarReporte, editarUsuario, 
    eliminarUsuario, agregarColmado, editarColmado, eliminarColmado,
    viewAsColmadoUser // <-- EXPORTANDO LA NUEVA FUNCIÓN
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) { throw new Error('useAppContext must be used within an AppProvider'); }
  return context;
};