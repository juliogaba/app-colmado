import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { PlusCircle, Store, MapPin, Phone, User, Search, MoreVertical, Pencil, Trash2, LayoutDashboard } from 'lucide-react';

const ColmadosPage = () => {
  const { colmados, agregarColmado, editarColmado, eliminarColmado, viewAsColmadoUser } = useAppContext();
  const navigate = useNavigate();

  // Estados para la búsqueda y los modales
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estados para los datos de los formularios
  const [nuevoColmado, setNuevoColmado] = useState({ nombre: '', direccion: '', telefono: '', contacto: '' });
  const [editingColmado, setEditingColmado] = useState(null);

  // --- Lógica de filtrado ---
  const filteredColmados = colmados.filter(colmado => 
    (colmado.nombre && colmado.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (colmado.direccion && colmado.direccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (colmado.contacto && colmado.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Manejadores para el formulario de AGREGAR ---
  const handleAddInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoColmado(prevState => ({ ...prevState, [id]: value }));
  };
  const handleAddSubmit = (e) => {
    e.preventDefault();
    agregarColmado(nuevoColmado);
    setIsAddDialogOpen(false);
    setNuevoColmado({ nombre: '', direccion: '', telefono: '', contacto: '' });
  };

  // --- Manejadores para el formulario de EDITAR ---
  const handleEditClick = (colmado) => {
    setEditingColmado(colmado);
    setIsEditDialogOpen(true);
  };
  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditingColmado(prevState => ({ ...prevState, [id]: value }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingColmado) return;
    const { id, ...datosActualizados } = editingColmado;
    editarColmado(id, datosActualizados);
    setIsEditDialogOpen(false);
    setEditingColmado(null);
  };
  
  // --- Manejador para IR AL DASHBOARD ---
  const handleGoToDashboard = (colmadoId) => {
    const success = viewAsColmadoUser(colmadoId);
    if (success) {
      navigate('/colmado');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6" />Red de Colmados Afiliados</h1>
          <p className="text-muted-foreground">Gestiona los colmados donde se puede usar la Tarjeta Colmado.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Agregar Colmado</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar Nuevo Colmado</DialogTitle><DialogDescription>Completa los datos para registrar un nuevo colmado en la red.</DialogDescription></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div><Label htmlFor="nombre">Nombre</Label><Input id="nombre" value={nuevoColmado.nombre} onChange={handleAddInputChange} required /></div>
              <div><Label htmlFor="direccion">Dirección</Label><Input id="direccion" value={nuevoColmado.direccion} onChange={handleAddInputChange} required /></div>
              <div><Label htmlFor="telefono">Teléfono</Label><Input id="telefono" value={nuevoColmado.telefono} onChange={handleAddInputChange} /></div>
              <div><Label htmlFor="contacto">Contacto</Label><Input id="contacto" value={nuevoColmado.contacto} onChange={handleAddInputChange} /></div>
              <DialogFooter><Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar Colmado</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar colmado..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredColmados.map(colmado => (
          <Card key={colmado.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between bg-slate-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg"><Store className="h-6 w-6 text-blue-600"/></div>
                <div>
                  <CardTitle>{colmado.nombre}</CardTitle>
                  <p className="text-sm text-muted-foreground">{colmado.id}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(colmado)}><Pencil className="mr-2 h-4 w-4" /><span>Editar</span></DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-50 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /><span>Eliminar</span></DropdownMenuItem></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el colmado <span className="font-bold">{colmado.nombre}</span>.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => eliminarColmado(colmado.id)} className="bg-red-600 hover:bg-red-700">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-grow">
              <div className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{colmado.direccion}</span></div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 flex-shrink-0" /><span>{colmado.telefono}</span></div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4 flex-shrink-0" /><span>Contacto: {colmado.contacto}</span></div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => handleGoToDashboard(colmado.id)}>
                <LayoutDashboard className="mr-2 h-4 w-4"/>
                Ir al Dashboard
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* --- MODAL PARA EDITAR COLMADO --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Colmado</DialogTitle><DialogDescription>Modifica los datos del colmado seleccionado.</DialogDescription></DialogHeader>
          {editingColmado && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div><Label htmlFor="nombre-edit">Nombre</Label><Input id="nombre" value={editingColmado.nombre} onChange={handleEditInputChange} required /></div>
              <div><Label htmlFor="direccion-edit">Dirección</Label><Input id="direccion" value={editingColmado.direccion} onChange={handleEditInputChange} required /></div>
              <div><Label htmlFor="telefono-edit">Teléfono</Label><Input id="telefono" value={editingColmado.telefono} onChange={handleEditInputChange} /></div>
              <div><Label htmlFor="contacto-edit">Contacto</Label><Input id="contacto" value={editingColmado.contacto} onChange={handleEditInputChange} /></div>
              <DialogFooter><Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar Cambios</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ColmadosPage;