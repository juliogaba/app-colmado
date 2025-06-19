import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Users, Pencil, Trash2 } from 'lucide-react';

const UsuariosPage = () => {
  const { usuarios, colmados, agregarUsuario, editarUsuario, eliminarUsuario } = useAppContext();
  
  // Estados para los modales
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estados para los datos de los formularios
  const [newUser, setNewUser] = useState({ username: '', password: '', role: '', colmadoId: '' });
  const [editingUser, setEditingUser] = useState(null);

  // Manejador para el formulario de AGREGAR
  const handleAddInputChange = (e) => {
    const { id, value } = e.target;
    setNewUser(prev => ({ ...prev, [id]: value }));
  };
  const handleAddRoleChange = (value) => {
    setNewUser(prev => ({ ...prev, role: value, colmadoId: '' }));
  };
  const handleAddColmadoChange = (value) => {
    setNewUser(prev => ({ ...prev, colmadoId: value }));
  };
  const handleAddSubmit = (e) => {
    e.preventDefault();
    let userData = { ...newUser };
    if (userData.role !== 'colmado') {
      delete userData.colmadoId;
    }
    agregarUsuario(userData);
    setIsAddDialogOpen(false);
    setNewUser({ username: '', password: '', role: '', colmadoId: '' });
  };

  // Manejador para el formulario de EDITAR
  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };
  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditingUser(prev => ({ ...prev, [id]: value }));
  };
    const handleEditRoleChange = (value) => {
    setEditingUser(prev => ({ ...prev, role: value, colmadoId: '' }));
  };
  const handleEditColmadoChange = (value) => {
    setEditingUser(prev => ({ ...prev, colmadoId: value }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const { id, ...datosActualizados } = editingUser;
    
    // Si la contraseña está vacía, no la actualizamos
    if (!datosActualizados.password) {
        delete datosActualizados.password;
    }

    editarUsuario(id, datosActualizados);
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gestión de Usuarios
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Agregar Usuario</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Nuevo Usuario</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div><Label htmlFor="username">Username</Label><Input id="username" value={newUser.username} onChange={handleAddInputChange} required /></div>
              <div><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" value={newUser.password} onChange={handleAddInputChange} required /></div>
              <div><Label>Rol</Label><Select onValueChange={handleAddRoleChange} value={newUser.role} required><SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger><SelectContent><SelectItem value="administrador">Administrador</SelectItem><SelectItem value="colmado">Usuario de Colmado</SelectItem></SelectContent></Select></div>
              {newUser.role === 'colmado' && (<div><Label>Colmado Asignado</Label><Select onValueChange={handleAddColmadoChange} value={newUser.colmadoId} required><SelectTrigger><SelectValue placeholder="Selecciona un colmado" /></SelectTrigger><SelectContent>{colmados.map(colmado => (<SelectItem key={colmado.id} value={colmado.id}>{colmado.nombre}</SelectItem>))}</SelectContent></Select></div>)}
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button><Button type="submit">Crear Usuario</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- TABLA DE USUARIOS MEJORADA --- */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Colmado Asignado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map(user => {
            const colmadoAsignado = user.role === 'colmado' ? colmados.find(c => c.id === user.colmadoId)?.nombre : 'N/A';
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{colmadoAsignado || 'No encontrado'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={user.id === 'u1'}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro de que quieres eliminar a este usuario?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente al usuario <span className="font-bold">{user.username}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => eliminarUsuario(user.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* --- MODAL PARA EDITAR USUARIO --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div><Label htmlFor="edit-username">Username</Label><Input id="username" value={editingUser?.username || ''} onChange={handleEditInputChange} required /></div>
            <div><Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label><Input id="password" type="password" placeholder="Dejar en blanco para no cambiar" onChange={handleEditInputChange} /></div>
            <div><Label>Rol</Label><Select onValueChange={handleEditRoleChange} value={editingUser?.role || ''} required><SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger><SelectContent><SelectItem value="administrador">Administrador</SelectItem><SelectItem value="colmado">Usuario de Colmado</SelectItem></SelectContent></Select></div>
            {editingUser?.role === 'colmado' && (<div><Label>Colmado Asignado</Label><Select onValueChange={handleEditColmadoChange} value={editingUser?.colmadoId || ''} required><SelectTrigger><SelectValue placeholder="Selecciona un colmado" /></SelectTrigger><SelectContent>{colmados.map(colmado => (<SelectItem key={colmado.id} value={colmado.id}>{colmado.nombre}</SelectItem>))}</SelectContent></Select></div>)}
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar Cambios</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsuariosPage;