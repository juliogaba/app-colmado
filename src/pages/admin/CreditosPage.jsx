import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, CreditCard, Search, SlidersHorizontal, Star, Edit, Trash2, AlertTriangle } from "lucide-react";

const CreditosPage = () => {
    const { 
        pagos = [], creditos = [], clientes = [], colmados = [], 
        adminCrearClienteYCredito, editarCliente, eliminarCliente 
    } = useAppContext();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedCredito, setSelectedCredito] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState({ nombre: '', cedula: '', telefono: '' });
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    
    const [solicitudData, setSolicitudData] = useState({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    const hoy = new Date();
    const pagosDelMes = pagos.filter(pago => {
        if (!pago || !pago.fecha) return false;
        const fechaPago = new Date(pago.fecha);
        if (isNaN(fechaPago.getTime())) return false;
        return fechaPago.getMonth() === hoy.getMonth() && fechaPago.getFullYear() === hoy.getFullYear();
    });
    const interesCobradoEnMes = pagosDelMes.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);
    const gananciaPlataforma = interesCobradoEnMes * (10 / 15);

    const creditosConNombres = creditos.map(credito => {
        const cliente = clientes.find(c => c.id === credito.clienteId);
        const colmado = credito.colmadoId ? colmados.find(co => co.id === credito.colmadoId) : null;
        const deudaTotal = (credito.capitalUtilizado || 0) + (credito.interesAdeudado || 0);
        let estadoCalculado = credito.estado;
        if (credito.estado === 'activo' && deudaTotal <= 0.01 && (credito.capitalUtilizado || 0) <= 0.01) {
            estadoCalculado = 'pagado';
        }
        return { ...credito, cliente, colmado, deudaTotal, estadoCalculado };
    });

    const creditosFiltrados = creditosConNombres.filter(c => {
        const nombreCliente = c.cliente?.nombre || '';
        const nombreColmado = c.colmado?.nombre || '';
        const busquedaCoincide = nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) || nombreColmado.toLowerCase().includes(searchTerm.toLowerCase());
        const estadoCoincide = statusFilter === 'todos' || c.estadoCalculado === statusFilter;
        return busquedaCoincide && estadoCoincide;
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setSolicitudData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        adminCrearClienteYCredito({
            nombre: solicitudData.nombre, cedula: solicitudData.cedula, direccion: solicitudData.direccion,
            telefono: solicitudData.contacto, monto: parseFloat(solicitudData.montoCredito), esVip: true
        });
        setIsCreateDialogOpen(false);
        setSolicitudData({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' });
    };

    const handleOpenDetails = (credito) => {
        setSelectedCredito(credito);
        setEditData({
            nombre: credito.cliente?.nombre || '',
            cedula: credito.cliente?.cedula || '',
            telefono: credito.cliente?.telefono || '',
        });
        setIsDetailDialogOpen(true);
        setIsEditMode(false);
    };

    const handleEditClick = () => setIsEditMode(true);
    const handleEditFormChange = (e) => setEditData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        if (!selectedCredito?.cliente?.id) return;
        editarCliente(selectedCredito.cliente.id, editData);
        setIsDetailDialogOpen(false);
        setIsEditMode(false);
    };

    const handleDeleteClick = () => setIsConfirmDeleteOpen(true);

    const handleDeleteConfirmed = () => {
        if (!selectedCredito?.cliente?.id) return;
        if (eliminarCliente(selectedCredito.cliente.id)) {
            setIsConfirmDeleteOpen(false);
            setIsDetailDialogOpen(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <div><h1 className="text-3xl font-bold flex items-center gap-3"><CreditCard className="h-8 w-8" />Gestión de Créditos</h1></div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Solicitar Nuevo Crédito</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Crear Crédito para Cliente VIP</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div><Label htmlFor="nombre">Nombre del Cliente</Label><Input id="nombre" value={solicitudData.nombre} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="cedula">Cédula</Label><Input id="cedula" value={solicitudData.cedula} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="direccion">Dirección</Label><Input id="direccion" value={solicitudData.direccion} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="contacto">Teléfono/Contacto</Label><Input id="contacto" value={solicitudData.contacto} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="montoCredito">Monto de Crédito Solicitado</Label><Input id="montoCredito" type="number" value={solicitudData.montoCredito} onChange={handleInputChange} required /></div>
                            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button><Button type="submit">Enviar Solicitud</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="text-center bg-blue-600 text-white p-4 rounded-lg shadow-lg mb-8">
                <p className="font-semibold text-sm uppercase tracking-wider">GANANCIA PLATAFORMA, MES EN CURSO</p>
                <p className="text-5xl font-bold tracking-tight">${gananciaPlataforma.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
            </div>

            <Card className="mb-8">
                <CardHeader><CardTitle>Todos los Créditos</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por cliente o colmado..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue placeholder="Filtrar por estado" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los Estados</SelectItem><SelectItem value="activo">Activo</SelectItem><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="pagado">Pagado</SelectItem></SelectContent></Select>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Asignado a</TableHead><TableHead>Monto</TableHead><TableHead>Deuda</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                        <TableBody>{creditosFiltrados.map(credito => (<TableRow key={credito.id} onClick={() => handleOpenDetails(credito)} className="cursor-pointer hover:bg-gray-50"><TableCell className="font-medium">{credito.cliente?.nombre || 'N/A'}</TableCell><TableCell>{credito.cliente?.esVip ? <span className="font-semibold text-purple-600 flex items-center gap-1"><Star size={14}/> VIP</span> : credito.colmado?.nombre}</TableCell><TableCell>${(credito.montoAprobado || 0).toLocaleString()}</TableCell><TableCell>${(credito.deudaTotal || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell><TableCell><span className={`px-2 py-1 rounded-full text-xs font-semibold ${credito.estadoCalculado === 'activo' ? 'bg-green-100 text-green-800' : credito.estadoCalculado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{credito.estadoCalculado}</span></TableCell></TableRow>))}</TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDetailDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setIsEditMode(false); setIsDetailDialogOpen(isOpen); }}>
                <DialogContent className="max-w-md">
                    {selectedCredito && (
                        isEditMode ? (
                            <form onSubmit={handleUpdateSubmit}>
                                <DialogHeader><DialogTitle className="text-2xl">Editando a {selectedCredito.cliente?.nombre}</DialogTitle><DialogDescription>Modifica los datos del cliente y haz clic en Guardar.</DialogDescription></DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div><Label htmlFor="nombre">Nombre</Label><Input id="nombre" value={editData.nombre} onChange={handleEditFormChange} /></div>
                                    <div><Label htmlFor="cedula">Cédula</Label><Input id="cedula" value={editData.cedula} onChange={handleEditFormChange} /></div>
                                    <div><Label htmlFor="telefono">Teléfono</Label><Input id="telefono" value={editData.telefono} onChange={handleEditFormChange} /></div>
                                </div>
                                <DialogFooter className="pt-4"><Button type="button" variant="ghost" onClick={() => setIsEditMode(false)}>Cancelar</Button><Button type="submit">Guardar Cambios</Button></DialogFooter>
                            </form>
                        ) : (
                            <>
                                <DialogHeader><DialogTitle className="text-2xl">{selectedCredito.cliente?.nombre}</DialogTitle><DialogDescription>ID Cliente: {selectedCredito.cliente?.id}</DialogDescription></DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cédula</span><span className="font-medium">{selectedCredito.cliente?.cedula || 'N/A'}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Teléfono</span><span className="font-medium">{selectedCredito.cliente?.telefono || 'N/A'}</span></div>
                                    <div className="border-t my-4"></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">ID Crédito</span><span className="font-mono text-xs bg-gray-100 p-1 rounded">{selectedCredito.id}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Crédito Otorgado</span><span className="font-medium text-blue-600">${(selectedCredito.montoAprobado || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Deuda Actual</span><span className="font-medium text-red-600">${(selectedCredito.deudaTotal || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Disponible</span><span className="font-medium text-green-600">${((selectedCredito.montoAprobado || 0) - (selectedCredito.capitalUtilizado || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span></div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button variant="outline" onClick={handleEditClick}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                                    <Button variant="destructive" onClick={handleDeleteClick}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                </DialogFooter>
                            </>
                        )
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" />¿Estás realmente seguro?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se borrará permanentemente el cliente y todo su historial de crédito.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirmed}>Sí, eliminar permanentemente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreditosPage;