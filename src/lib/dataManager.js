// Pega este código completo en: src/lib/dataManager.js

// --- FUNCIONES AUXILIARES PARA LOCALSTORAGE ---
// Estas funciones son necesarias para guardar y cargar datos
const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// --- DATOS INICIALES (LA FUNCIÓN QUE YA HABÍAMOS MODIFICADO) ---
// Aquí están las listas vacías, con solo el usuario admin
const getInitialData = () => {
  return {
    usuarios: [
      { id: 'admin1', username: 'admin', password: '123', role: 'administrador' }
    ],
    colmados: [],
    clientes: [],
    creditos: [],
    consumos: [],
    pagos: []
  };
};

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (ESTA FUE LA QUE SE BORRÓ) ---
// Esta es la función que el error dice que falta.
const initializeData = () => {
  const keys = ['usuarios', 'colmados', 'clientes', 'creditos', 'consumos', 'pagos'];
  let data = {};
  
  keys.forEach(key => {
    const existingData = loadData(key);
    // Si ya hay datos en localStorage, los usamos.
    if (existingData) {
      data[key] = existingData;
    } else {
      // Si no hay datos, usamos los datos iniciales (que ahora están limpios)
      const initialData = getInitialData();
      data[key] = initialData[key];
      saveData(key, initialData[key]);
    }
  });

  return data;
};

// --- EXPORTACIONES (MUY IMPORTANTE) ---
// Aquí le decimos a JavaScript qué funciones pueden ser usadas por otros archivos.
export { initializeData, saveData, loadData };