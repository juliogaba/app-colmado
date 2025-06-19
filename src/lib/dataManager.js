const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
const loadData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};
const getInitialData = () => {
  return {
    usuarios: [ { id: 'admin1', username: 'admin', password: '123', role: 'administrador' }, { id: 'colmado1', username: 'colmado_juan', password: '123', role: 'colmado', colmadoId: 'c1' } ],
    colmados: [ { id: 'c1', nombre: 'Colmado Don Juan', direccion: 'Calle Falsa 123, SD', telefono: '809-555-1234', contacto: 'Juan Perez' } ],
    clientes: [ { id: 'cli1', nombre: 'Juan Pérez', cedula: '001-1234567-8', colmadoId: 'c1', telefono: '809-111-2222' } ],
    creditos: [ { id: 'cred1', clienteId: 'cli1', colmadoId: 'c1', montoAprobado: 5000, saldoDisponible: 5000, estado: 'activo', tasaInteres: 0.15, interesAdeudado: 0 } ],
    consumos: [],
    pagos: [],
  };
};
export const initializeData = () => {
  const keys = ['usuarios', 'colmados', 'clientes', 'creditos', 'consumos', 'pagos'];
  let data = {};
  keys.forEach(key => {
    const existingData = loadData(key);
    if (existingData && Array.isArray(existingData)) { data[key] = existingData; } 
    else {
      const initialData = getInitialData();
      data[key] = initialData[key];
      saveData(key, initialData[key]);
    }
  });
  return data;
};
export { saveData, loadData };