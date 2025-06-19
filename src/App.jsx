import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const NotFoundPage = () => <div className="p-8"><h1>404 - Página no encontrada</h1></div>;

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
  
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <Routes>
       <Route path="/" element={<Navigate to={currentUser.role === 'administrador' ? '/admin' : '/colmado'} />} />
       
       <Route element={<DashboardLayout />}>
          {currentUser.role === 'administrador' && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/colmados" element={<ColmadosPage />} />
              <Route path="/admin/usuarios" element={<UsuariosPage />} />
              
              {/* RUTA RESTAURADA */}
              <Route path="/admin/creditos" element={<CreditosPage />} />
              
              {/* Rutas para ver historiales completos */}
              <Route path="/admin/creditos/todos" element={<AllCreditsPage />} />
              <Route path="/admin/consumos/todos" element={<AllConsumosPage />} />
              <Route path="/admin/pagos/todos" element={<AllPagosPage />} />
            </>
          )}

          {currentUser.role === 'colmado' && (
             <Route path="/colmado" element={<ColmadoDashboard />} />
          )}
       </Route>
       
       <Route path="/login" element={<Navigate to="/" />} />
       <Route path="*" element={<NotFoundPage />} />
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