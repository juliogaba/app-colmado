import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const logoUrl = '/logo-dashboard.png'; 

export const DashboardLayout = () => {
  const { logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-16 items-center justify-between rounded-t-lg border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-6">
            <img src={logoUrl} alt="Logo" className="h-8" />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/admin" className="text-gray-900 font-semibold transition-colors hover:text-gray-900">Inicio</Link>
              <Link to="/admin/creditos" className="text-muted-foreground transition-colors hover:text-gray-900">Créditos</Link>
              <Link to="/admin/consumos" className="text-muted-foreground transition-colors hover:text-gray-900">Consumos</Link>
              <Link to="/admin/analisis" className="text-muted-foreground transition-colors hover:text-gray-900">Análisis</Link>
              <Link to="/admin/colmados" className="text-muted-foreground transition-colors hover:text-gray-900">Colmados</Link>
              <Link to="/admin/usuarios" className="text-muted-foreground transition-colors hover:text-gray-900">Usuarios</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full"><Avatar><AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt="AD" /><AvatarFallback>AD</AvatarFallback></Avatar></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Configuración</DropdownMenuItem>
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="bg-white p-6 rounded-b-lg shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};