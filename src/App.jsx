import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ColmadosPage from './pages/admin/ColmadosPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import CreditosPage from './pages/admin/CreditosPage';
import ColmadoDashboard from './pages/colmado/ColmadoDashboard';
import AllCreditsPage from './pages/admin/AllCreditsPage';
import AllConsumosPage from './pages/admin/AllConsumosPage';
import AllPagosPage from './pages/admin/AllPagosPage';

const NotFoundPage = () => <div className="p-8 text-center"><h1>404 - Página no encontrada</h1><p>La ruta que buscas no existe.</p></div>;

const AppContent = () => {
  const { currentUser, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <img src="/logo.png" alt="Cargando..." className="w-48 h-auto animate-pulse" />
        <p className="mt-4 text-muted-foreground">Cargando sistema...</p>
      </div>
    );
  }

  // --- ESTRUCTURA DE RUTAS SIMPLIFICADA Y ROBUSTA ---
  return (
    <Routes>
      {/* Si no hay usuario, la única ruta es /login */}
      {!currentUser && (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      {/* Si SÍ hay usuario, se definen las rutas de la aplicación */}
      {currentUser && (
        <>
          {/* La ruta raíz redirige al dashboard correcto */}
          <Route 
            path="/" 
            element={
              <Navigate to={currentUser.role === 'administrador' ? '/admin' : '/colmado'} replace />
            } 
          />
          
          {/* Rutas para Administrador anidadas bajo /admin */}
          <Route path="/admin" element={currentUser.role === 'administrador' ? <DashboardLayout /> : <Navigate to="/login" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="colmados" element={<ColmadosPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="creditos" element={<CreditosPage />} />
            {/* Aquí puedes añadir más rutas que usen el mismo layout */}
          </Route>

          {/* Rutas para Colmado anidadas bajo /colmado */}
          <Route path="/colmado" element={currentUser.role === 'colmado' ? <DashboardLayout /> : <Navigate to="/login" />}>
            <Route index element={<ColmadoDashboard />} />
             {/* Si el colmado tuviera más sub-páginas, irían aquí */}
          </Route>
          
          {/* Si un usuario logueado intenta ir a /login, lo mandamos a su dashboard */}
           <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Cualquier otra ruta no encontrada */}
          <Route path="*" element={<NotFoundPage />} />
        </>
      )}
    </Routes>
  );
};


function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;