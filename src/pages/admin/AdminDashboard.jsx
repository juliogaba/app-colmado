import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Banknote, Clock, CreditCard, DollarSign, Home, Landmark, PlusCircle, UserCheck, Zap, Printer } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";

const PUNTAJE_CREDITICIO = 806;
const PUNTAJE_MAXIMO = 850;
const dataPuntaje = [ { name: 'Puntaje', value: PUNTAJE_CREDITICIO }, { name: 'Restante', value: PUNTAJE_MAXIMO - PUNTAJE_CREDITICIO }, ];
const COLORS = ['#22c55e', '#e5e7eb'];

const AdminDashboard = () => {
  const { colmados, creditos, clientes, consumos, pagos, aprobarCredito } = useAppContext();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const creditosActivos = creditos.filter(c => c.estado === 'activo');
  const montoTotalOtorgado = creditosActivos.reduce((total, credito) => total + credito.montoAprobado, 0);
  const deudaCapitalTotal = creditosActivos.reduce((total, credito) => total + (credito.capitalUtilizado || 0), 0);
  const interesAdeudadoTotal = creditosActivos.reduce((total, credito) => total + (credito.interesAdeudado || 0), 0);
  const deudaTotalEnCalle = deudaCapitalTotal + interesAdeudadoTotal;
  const totalConsumidoHistorico = consumos.reduce((total, consumo) => total + consumo.monto, 0);
  const totalPagado = pagos.reduce((total, pago) => total + (pago.montoTotal || 0), 0);
  const porcentajeUtilizacion = montoTotalOtorgado > 0 ? (deudaCapitalTotal / montoTotalOtorgado) * 100 : 0;
  const creditosPendientes = creditos.filter(c => c.estado === 'pendiente');
  const creditosRecientes = creditos.slice(-5).reverse();
  const consumosRecientesConNombre = consumos.slice(-5).reverse().map(cons => {
    const creditoAsociado = creditos.find(cr => cr.id === cons.creditoId);
    const clienteAsociado = clientes.find(c => c.id === creditoAsociado?.clienteId);
    return { ...cons, nombreCliente: clienteAsociado ? clienteAsociado.nombre : 'Cliente no encontrado', creditoId: creditoAsociado?.id };
  });
  const pagosRecientes = pagos.slice(-5).reverse();

  const handleAprobar = (creditoId) => {
    aprobarCredito(creditoId);
  };

  const handleOpenDetail = (creditoId) => {
    const credito = creditos.find(cr => cr.id === creditoId);
    if (!credito) { alert("No se pudo encontrar la información del crédito."); return; }
    const cliente = clientes.find(c => c.id === credito.clienteId);
    const consumosCliente = consumos.filter(c => c.creditoId === credito.id);
    const pagosCliente = pagos.filter(p => p.creditoId === credito.id);
    setDetailData({ cliente, credito, consumos: consumosCliente, pagos: pagosCliente });
    setIsDetailOpen(true);
  };

  const handlePrintReport = () => { window.print(); };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4"><div><h1 className="text-2xl font-bold">Panel de Control</h1><p className="text-muted-foreground">Bienvenido a tu sistema Tarjeta Colmado</p></div><div className="hidden lg:flex flex-grow justify-center gap-4"><div className="bg-red-500 text-white py-2 px-6 rounded-lg shadow text-center"><h3 className="text-xs font-semibold uppercase tracking-wider">Deuda Total en Calle</h3><p className="text-2xl font-bold">${deudaTotalEnCalle.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><div className="bg-green-600 text-white py-2 px-6 rounded-lg shadow text-center"><h3 className="text-xs font-semibold uppercase tracking-wider">Total Pagado</h3><p className="text-2xl font-bold">${totalPagado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div></div><div className="flex gap-2"><Button variant="outline" disabled><Zap className="mr-2 h-4 w-4" />Procesar Ciclo</Button><Button disabled><PlusCircle className="mr-2 h-4 w-4" />Nuevo Crédito</Button></div></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6"><Card className="border-l-4 border-blue-500"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Monto Total Otorgado</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${montoTotalOtorgado.toLocaleString()}</div><p className="text-xs text-muted-foreground">Capital total en el sistema</p></CardContent></Card><Card className="border-l-4 border-cyan-500"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Consumido (Histórico)</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${totalConsumidoHistorico.toLocaleString()}</div><p className="text-xs text-muted-foreground">Suma de todas las compras</p></CardContent></Card><Card className="border-l-4 border-green-500"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Colmados Activos</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{colmados.length}</div><p className="text-xs text-muted-foreground">Total de colmados en la red</p></CardContent></Card><Card className="border-l-4 border-yellow-500"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Créditos Pendientes</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{creditosPendientes.length}</div><p className="text-xs text-muted-foreground">Solicitudes por aprobar</p></CardContent></Card></div>
      <div className="mb-6"><h2 className="text-xl font-semibold mb-4">Solicitudes Pendientes de Aprobación</h2><Card><Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Colmado</TableHead><TableHead>Monto Solicitado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{creditosPendientes.length > 0 ? (creditosPendientes.map(credito => { const cliente = clientes.find(c => c.id === credito.clienteId); const colmado = credito.colmadoId ? colmados.find(co => co.id === credito.colmadoId) : null; return (<TableRow key={credito.id}><TableCell className="font-medium">{cliente?.nombre || 'N/A'}</TableCell><TableCell>{colmado ? colmado.nombre : <span className="font-semibold text-purple-600 flex items-center gap-1"><UserCheck size={14}/> Cliente VIP</span>}</TableCell><TableCell>${credito.montoAprobado.toLocaleString()}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => handleAprobar(credito.id)}>Aprobar</Button></TableCell></TableRow>);})) : (<TableRow><TableCell colSpan="4" className="text-center h-24">No hay solicitudes pendientes.</TableCell></TableRow>)}</TableBody></Table></Card></div>
      <Card className="mb-6"><CardHeader className="bg-slate-800 text-white rounded-t-lg"><CardTitle>Resumen de Crédito</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 gap-6 p-6"><div><h3 className="font-semibold mb-2">Utilización de Crédito</h3><Progress value={porcentajeUtilizacion} className="h-3" /><div className="flex justify-between text-sm text-muted-foreground mt-2"><span>Utilizado</span><span>{porcentajeUtilizacion.toFixed(0)}%</span></div><div className="flex justify-between font-bold mt-4"><span>Capital Otorgado</span><span>${montoTotalOtorgado.toLocaleString()}</span></div><div className="flex justify-between font-bold"><span>Capital Utilizado</span><span>${deudaCapitalTotal.toLocaleString()}</span></div></div><div className="flex flex-col items-center justify-center"><h3 className="font-semibold mb-2">Puntaje Crediticio</h3><div style={{ width: '100%', height: 150 }}><ResponsiveContainer><PieChart><Pie data={dataPuntaje} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} cornerRadius={10} paddingAngle={2} dataKey="value">{dataPuntaje.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie></PieChart></ResponsiveContainer><div className="text-3xl font-bold -mt-24 text-center text-green-500">{PUNTAJE_CREDITICIO}</div><div className="text-sm text-muted-foreground text-center">de {PUNTAJE_MAXIMO}</div></div><p className="text-sm font-medium mt-12">Excelente puntaje crediticio</p></div></CardContent></Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Card className="lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Últimos Créditos</CardTitle><Link to="/admin/creditos/todos" className="text-sm font-medium text-blue-600 hover:underline">Ver todos</Link></CardHeader><CardContent>{creditosRecientes.map(cred => (<button key={cred.id} onClick={() => handleOpenDetail(cred.id)} className="w-full text-left p-3 -mx-3 hover:bg-gray-100 rounded-md transition-colors"><div className="flex items-center justify-between"><div><p className="font-medium">{clientes.find(c=>c.id === cred.clienteId)?.nombre || 'N/A'}</p><p className="text-sm text-muted-foreground">Monto: ${cred.montoAprobado.toLocaleString()} | Estado: <span className={cred.estado === 'activo' ? 'text-green-500' : 'text-yellow-500'}>{cred.estado}</span></p></div><span className="text-sm font-medium text-blue-600">Ver →</span></div></button>))}</CardContent></Card><Card className="lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Últimos Consumos</CardTitle><Link to="/admin/consumos/todos" className="text-sm font-medium text-blue-600 hover:underline">Ver todos</Link></CardHeader><CardContent>{consumosRecientesConNombre.map(cons => (<button key={cons.id} onClick={() => handleOpenDetail(cons.creditoId)} className="w-full text-left p-3 -mx-3 hover:bg-gray-100 rounded-md transition-colors"><div className="flex items-center justify-between"><div><p className="font-medium">{cons.nombreCliente}</p><p className="text-sm text-muted-foreground">Monto: ${cons.monto.toLocaleString()} | {cons.descripcion || 'Sin descripción'}</p></div><span className="text-sm font-medium text-blue-600">Ver →</span></div></button>))}</CardContent></Card><Card className="lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Pagos Recientes</CardTitle><Link to="/admin/pagos/todos" className="text-sm font-medium text-blue-600 hover:underline">Ver todos</Link></CardHeader><CardContent>{pagosRecientes.length > 0 ? (pagosRecientes.map(pago => { const credito = creditos.find(c => c.id === pago.creditoId); const cliente = clientes.find(cl => cl.id === credito?.clienteId); return (<button key={pago.id} onClick={() => handleOpenDetail(pago.creditoId)} className="w-full text-left p-3 -mx-3 hover:bg-gray-100 rounded-md transition-colors"><div className="flex items-center justify-between"><div><p className="font-medium">{cliente?.nombre || 'N/A'}</p><p className="text-sm text-green-600 font-medium">+ ${pago.montoTotal.toLocaleString()}</p></div><span className="text-sm font-medium text-blue-600">Ver →</span></div></button>);})) : (<p className="text-center py-8 text-gray-500">No hay pagos recientes.</p>)}</CardContent></Card></div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {detailData && (
            <div className="printable-area">
              <DialogHeader><DialogTitle className="text-2xl">{detailData.cliente?.nombre}</DialogTitle><DialogDescription>Cédula: {detailData.cliente?.cedula || 'N/A'}</DialogDescription></DialogHeader>
              {detailData.credito ? (
                <div className="py-4 space-y-6">
                  <div><h4 className="font-semibold mb-2 text-lg">Resumen del Crédito</h4><div className="p-4 border rounded-lg grid grid-cols-2 gap-4 bg-gray-50"><div><p className="text-sm text-gray-500">ID de Crédito</p><p className="font-mono bg-gray-200 px-2 py-1 rounded-md text-sm">{detailData.credito.id}</p></div><div><p className="text-sm text-gray-500">Estado</p><p className="font-semibold text-green-600 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>Activo</p></div><div><p className="text-sm text-gray-500">Crédito Otorgado</p><p className="font-semibold text-base">${detailData.credito.montoAprobado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div>
                  <div><p className="text-sm text-gray-500">Saldo Disponible</p><p className="font-semibold text-base">${(detailData.credito.montoAprobado - (detailData.credito.capitalUtilizado || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div>
                  <div className="col-span-2 border-t pt-4 mt-2"><p className="text-sm text-gray-500">Deuda Total (Capital + Interés)</p><p className="text-xl font-bold text-red-600">${((detailData.credito.capitalUtilizado || 0) + (detailData.credito.interesAdeudado || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div>
                  </div></div>
                  <div><h4 className="font-semibold mb-2 text-lg">Historial de Consumos</h4><div className="border rounded-lg max-h-40 overflow-y-auto">{detailData.consumos?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Interés</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>{detailData.consumos.map(cons => (<TableRow key={cons.id}><TableCell>{format(new Date(cons.fecha), 'P')}</TableCell><TableCell>{cons.descripcion}</TableCell><TableCell>${(cons.interesGenerado || 0).toFixed(2)}</TableCell><TableCell className="text-right">${cons.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>))}</TableBody></Table>) : <p className="p-6 text-center text-gray-500">No se han registrado consumos.</p>}</div></div>
                   <div><h4 className="font-semibold mb-2 text-lg">Historial de Pagos</h4><div className="border rounded-lg max-h-40 overflow-y-auto">{detailData.pagos?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>A Interés</TableHead><TableHead>A Capital</TableHead><TableHead className="text-right font-semibold">Monto Total</TableHead></TableRow></TableHeader><TableBody>{detailData.pagos.map(pago => (<TableRow key={pago.id}><TableCell>{format(new Date(pago.fecha), 'P')}</TableCell><TableCell className="text-right">${(pago.montoInteres || 0).toFixed(2)}</TableCell><TableCell className="text-right">${(pago.montoCapital || 0).toFixed(2)}</TableCell><TableCell className="text-right text-green-600 font-medium">+ ${pago.montoTotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>))}</TableBody></Table>) : <p className="p-6 text-center text-gray-500">No se han registrado pagos.</p>}</div></div>
                </div>
              ) : <p className="py-4">Este cliente no tiene un crédito activo.</p>}
              <DialogFooter className="no-print pt-4 border-t"><Button variant="outline" onClick={handlePrintReport}><Printer className="mr-2 h-4 w-4" />Imprimir Resumen</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;


