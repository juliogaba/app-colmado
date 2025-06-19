// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  // Obtenemos los colmados del contexto para listarlos
  const { login, colmados } = useAppContext();
  const navigate = useNavigate();

  // --- NUEVOS ESTADOS PARA EL LOGIN DINÁMICO ---
  const [userType, setUserType] = useState('administrador'); // Para el primer <Select>
  const [selectedColmadoId, setSelectedColmadoId] = useState(''); // Para el segundo <Select>
  const [username, setUsername] = useState(''); // Cambiamos 'email' de vuelta a 'username' para claridad
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Verificación extra: si es un colmado, debe haber seleccionado uno.
    if (userType === 'colmado' && !selectedColmadoId) {
      setError('Por favor, selecciona un colmado.');
      return;
    }

    try {
      // Pasamos el ID del colmado a la función de login para una validación más segura
      const user = login(username, password, userType === 'colmado' ? selectedColmadoId : null);
      
      if (user) {
        navigate('/'); // El router en App.jsx se encarga del resto
      } else {
        setError('Las credenciales son incorrectas para el rol o colmado seleccionado.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <img src="/logo.png" alt="Tarjeta Colmado Logo" className="w-48 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Una dependencia de Producciones Gaba</p>
          <h1 className="text-3xl font-bold text-gray-800">Tarjeta Colmado</h1>
          <p className="text-gray-600">Inicia sesión para acceder a tu panel.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- PRIMER DESPLEGABLE: TIPO DE USUARIO --- */}
          <div className="space-y-2">
            <Label>Tipo de Usuario</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="colmado">Colmado</SelectItem>
                <SelectItem value="cliente" disabled>Cliente (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- SEGUNDO DESPLEGABLE: SE MUESTRA CONDICIONALMENTE --- */}
          {userType === 'colmado' && (
            <div className="space-y-2 animate-in fade-in-50">
              <Label>Seleccionar Colmado</Label>
              <Select value={selectedColmadoId} onValueChange={setSelectedColmadoId}>
                <SelectTrigger><SelectValue placeholder="Elige un colmado..." /></SelectTrigger>
                <SelectContent>
                  {colmados.map(colmado => (
                    <SelectItem key={colmado.id} value={colmado.id}>{colmado.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* --- CAMPOS DE CREDENCIALES --- */}
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="py-6" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="py-6" />
          </div>

          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700">
            <LogIn className="mr-2 h-5 w-5" />
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;