import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, CreditCard, Search, SlidersHorizontal, UserCheck, Star } from "lucide-react";

const CreditosPage = () => {
    const { pagos, creditos, clientes, colmados, crearClienteYsolicitarCredito } = useAppContext();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [solicitudData, setSolicitudData] = useState({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    // --- CÁLCULO DE GANANCIA MES ACTUAL ---
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anoActual = hoy.getFullYear();

    const pagosDelMes = pagos.filter(pago => {
        const fechaPago = new Date(pago.fecha);
        return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anoActual;
    });
    const interesCobradoEnMes = pagosDelMes.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);
    const gananciaPlataforma = interesCobradoEnMes * (10 / 15);

    // --- LÓGICA DE BÚSQUEDA Y FILTRADO ---
    const creditosConNombres = creditos.map(credito => {
        const cliente = clientes.find(c => c.id === credito.clienteId);
        const colmado = credito.colmadoId ? colmados.find(co => co.id === credito.colmadoId) : null;
        const deudaCapital = credito.montoAprobado - credito.saldoDisponible;
        const deudaTotal = deudaCapital + (credito.interesAdeudado || 0);
        let estadoCalculado = credito.estado;
        if (credito.estado === 'activo' && deudaTotal <= 0.01) {
            estadoCalculado = 'pagado';
        }
        return {
            ...credito,
            nombreCliente: cliente?.nombre || 'N/A',
            nombreColmado: colmado?.nombre || 'N/A (VIP)',
            esVip: cliente?.esVip || false,
            deudaTotal,
            estadoCalculado,
        };
    });

    const creditosFiltrados = creditosConNombres.filter(c => {
        const busquedaCoincide = c.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.nombreColmado.toLowerCase().includes(searchTerm.toLowerCase());
        const estadoCoincide = statusFilter === 'todos' || c.estadoCalculado === statusFilter;
        return busquedaCoincide && estadoCoincide;
    });

    // --- MANEJADORES PARA EL FORMULARIO VIP ---
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setSolicitudData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        crearClienteYsolicitarCredito({ ...solicitudData, montoCredito: parseFloat(solicitudData.montoCredito), esVip: true });
        setIsDialogOpen(false);
        setSolicitudData({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' });
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div><h1 className="text-3xl font-bold flex items-center gap-3"><CreditCard className="h-8 w-8" />Gestión de Créditos</h1></div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Solicitar Nuevo Crédito</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Crear Crédito para Cliente VIP</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div><Label htmlFor="nombre">Nombre del Cliente</Label><Input id="nombre" value={solicitudData.nombre} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="cedula">Cédula</Label><Input id="cedula" value={solicitudData.cedula} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="direccion">Dirección</Label><Input id="direccion" value={solicitudData.direccion} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="contacto">Teléfono/Contacto</Label><Input id="contacto" value={solicitudData.contacto} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="montoCredito">Monto de Crédito Solicitado</Label><Input id="montoCredito" type="number" value={solicitudData.montoCredito} onChange={handleInputChange} required /></div>
                            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit">Enviar Solicitud</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="text-center bg-blue-600 text-white p-4 rounded-lg shadow-lg mb-8">
                <p className="font-semibold text-sm uppercase tracking-wider">GANANCIA ACTUAL, MES EN CURSO (10%)</p>
                <p className="text-5xl font-bold tracking-tight">${gananciaPlataforma.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Todos los Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por cliente o colmado..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Estados</SelectItem>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="pagado">Pagado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Asignado a</TableHead><TableHead>Monto Otorgado</TableHead><TableHead>Deuda Actual</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {creditosFiltrados.map(credito => (
                                <TableRow key={credito.id}>
                                    <TableCell className="font-medium">{credito.nombreCliente}</TableCell>
                                    <TableCell>{credito.esVip ? <span className="font-semibold text-purple-600 flex items-center gap-1"><Star size={14}/> Cliente VIP</span> : credito.nombreColmado}</TableCell>
                                    <TableCell>${credito.montoAprobado.toLocaleString()}</TableCell>
                                    <TableCell>${credito.deudaTotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            credito.estadoCalculado === 'activo' ? 'bg-green-100 text-green-800' :
                                            credito.estadoCalculado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {credito.estadoCalculado}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Ganancia Intereses por Mes</CardTitle></CardHeader>
                <CardContent><p className="text-center text-gray-500 py-8">(Aquí mostraremos la lista de ganancias de meses anteriores y su buscador)</p></CardContent>
            </Card>
        </div>
    );
};

export default CreditosPage;