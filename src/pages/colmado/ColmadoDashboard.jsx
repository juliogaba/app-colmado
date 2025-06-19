import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Printer, Star, TrendingUp, FileText, Calendar as CalendarIcon, Search } from "lucide-react";

const ColmadoDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout, colmados, clientes, creditos, consumos, pagos, crearClienteYsolicitarCredito, registrarConsumo, registrarPago, generarReporte } = useAppContext();
  
  // Estados para todos los modales
  const [isSolicitudOpen, setIsSolicitudOpen] = useState(false);
  const [isConsumoOpen, setIsConsumoOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGananciaOpen, setIsGananciaOpen] = useState(false);
  const [isReportesOpen, setIsReportesOpen] = useState(false);

  // Estados para formularios y reportes
  const [solicitudData, setSolicitudData] = useState({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' });
  const [creditoIdInput, setCreditoIdInput] = useState('');
  const [creditoEncontrado, setCreditoEncontrado] = useState(null);
  const [consumoData, setConsumoData] = useState({ monto: '', descripcion: '' });
  const [pagoData, setPagoData] = useState({ monto: '' });
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportStep, setReportStep] = useState('selection');
  const [tipoReporte, setTipoReporte] = useState("");
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [reporteSearchTerm, setReporteSearchTerm] = useState("");
  const [reporteResultados, setReporteResultados] = useState(null);

  // Lógica de cálculos
  const miColmadoId = currentUser?.colmadoId;
  const misClientesLocales = clientes.filter(c => c.colmadoId === miColmadoId);
  const clientesVip = clientes.filter(c => c.esVip === true);
  const misClientesVisibles = [...new Map([...misClientesLocales, ...clientesVip].map(item => [item.id, item])).values()];
  const misCreditos = creditos.filter(c => misClientesVisibles.some(cli => cli.id === c.clienteId));
  const creditosActivos = misCreditos.filter(c => c.estado === 'activo');
  const creditoTotalOtorgado = creditosActivos.reduce((sum, c) => sum + c.montoAprobado, 0);
  const deudaBaseColmado = creditosActivos.reduce((sum, c) => sum + (c.montoAprobado - c.saldoDisponible), 0);
  const interesTotalColmado = creditosActivos.reduce((sum, c) => sum + (c.interesAdeudado || 0), 0);
  const consumoTotalConInteres = deudaBaseColmado + interesTotalColmado;
  const creditosPendientes = misCreditos.filter(c => c.estado === 'pendiente').length;
  const pagosDeMisCreditos = pagos.filter(pago => misCreditos.some(c => c.id === pago.creditoId));
  const interesTotalRecaudado = pagosDeMisCreditos.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);
  const gananciaColmado = interesTotalRecaudado * 0.035;
  const clientesFiltrados = misClientesVisibles.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (c.cedula && c.cedula.includes(searchTerm)));

  // Manejadores de acciones
  // Reemplaza tu función handleLogout con esta
  const handleLogout = () => {
    console.log("--- INICIO DE INTERROGACIÓN ---");
    console.log("1. El botón 'Cerrar Sesión' fue presionado. Evento onClick funcionando.");
    
    try {
      console.log("2. A punto de ejecutar la función logout() que viene del context...");
      
      logout(); // <-- Aquí se llama a la función que borra al usuario
      
      console.log("3. ¡ÉXITO! La función logout() se completó sin causar un 'crash'. El usuario en el estado de React ya es null.");
      console.log("4. Ahora se ejecutará la redirección forzada con window.location.href...");
      
      window.location.href = '/login';
      
      console.log("5. MENSAJE IMPOSIBLE: Si estás viendo esto, el navegador ha desafiado las leyes de la física.");

    } catch (error) {
      console.error("¡ERROR FATAL DETECTADO! La ejecución se detuvo aquí.");
      console.error("La función logout() o algo dentro de ella causó un 'crash' y nunca llegamos a la redirección.");
      console.error("El objeto del error es:", error);
    }
  };
  const handleSolicitudChange = (e) => setSolicitudData(prev => ({...prev, [e.target.id]: e.target.value}));
  const handleSolicitudSubmit = (e) => { e.preventDefault(); crearClienteYsolicitarCredito({ ...solicitudData, colmadoId: miColmadoId, montoCredito: parseFloat(solicitudData.montoCredito) }); setIsSolicitudOpen(false); setSolicitudData({ nombre: '', cedula: '', direccion: '', contacto: '', montoCredito: '' }); };
  const handleBuscarCredito = () => { setErrorBusqueda(''); const credito = creditos.find(c => c.id === creditoIdInput && c.estado === 'activo'); if (credito) { const clienteAsociado = clientes.find(cli => cli.id === credito.clienteId); if(clienteAsociado && (clienteAsociado.colmadoId === miColmadoId || clienteAsociado.esVip)) { setCreditoEncontrado(credito); } else { setErrorBusqueda('Crédito no pertenece a este colmado/cliente VIP.'); } } else { setErrorBusqueda('Código de crédito no encontrado o inactivo.'); } };
  const handleConsumoSubmit = (e) => { e.preventDefault(); if (!consumoData.monto || !creditoEncontrado) return; registrarConsumo(creditoEncontrado.id, parseFloat(consumoData.monto), consumoData.descripcion); resetSharedModal(); setIsConsumoOpen(false);};
  const handlePagoSubmit = (e) => { e.preventDefault(); if (!pagoData.monto || !creditoEncontrado) return; registrarPago(creditoEncontrado.id, parseFloat(pagoData.monto)); resetSharedModal(); setIsPagoOpen(false); };
  const handleOpenDetail = (cliente) => { const credito = creditos.find(cr => cr.clienteId === cliente.id); if(credito) { const consumosCliente = consumos.filter(c => c.creditoId === credito.id); const pagosCliente = pagos.filter(p => p.creditoId === credito.id); setDetailData({ cliente, credito, consumos: consumosCliente, pagos: pagosCliente }); setIsDetailOpen(true); } else { alert('Este cliente no tiene un crédito asociado.'); } };
  const resetSharedModal = () => { setCreditoIdInput(''); setCreditoEncontrado(null); setErrorBusqueda(''); setConsumoData({ monto: '', descripcion: '' }); setPagoData({ monto: '' }); };
  
  const handleOpenReportModal = () => { setReportStep('selection'); setTipoReporte(''); setReporteResultados(null); setIsReportesOpen(true); };
  const handleSelectReportType = () => { if (!tipoReporte) { alert("Por favor, seleccione un tipo de reporte."); return; } setReportStep('filters'); };
  const handleFinalReportGeneration = () => { const resultados = generarReporte({ tipoReporte, colmadoId: miColmadoId, dateRange, searchTerm: reporteSearchTerm }); setReporteResultados(resultados); setReportStep('results'); };
  const handlePrintReport = () => { window.print(); };

  const reportTitles = { consumos_clientes: "Reporte de Consumos de Clientes", ganancias_colmado: "Reporte de Ganancias (3.5%)", estado_cuenta_cliente: "Estado de Cuenta de Cliente" };

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold uppercase">
          {currentUser?.role === 'colmado' ? colmados.find(c=>c.id === currentUser?.colmadoId)?.nombre : 'Panel'} - Panel de Control
        </h1>
        <Button variant="outline" onClick={handleLogout}>Cerrar Sesión</Button>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6"><div className="p-4 bg-white rounded-lg shadow"><p className="text-sm text-gray-500">Crédito Total Otorgado</p><p className="text-2xl font-bold">${creditoTotalOtorgado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><div className="p-4 bg-white rounded-lg shadow"><p className="text-sm text-gray-500">Deuda Total + Interés</p><p className="text-2xl font-bold">${consumoTotalConInteres.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><div className="p-4 bg-white rounded-lg shadow"><p className="text-sm text-gray-500">Clientes Totales</p><p className="text-2xl font-bold">{misClientesVisibles.length}</p></div><div className="p-4 bg-white rounded-lg shadow"><p className="text-sm text-gray-500">Créditos Pendientes</p><p className="text-2xl font-bold">{creditosPendientes}</p></div></div>
      <div className="flex flex-wrap gap-4 mb-6"><div className="flex gap-4"><Button onClick={() => setIsSolicitudOpen(true)}>Nueva Solicitud</Button><Button onClick={() => {resetSharedModal(); setIsConsumoOpen(true)}} className="bg-green-500 hover:bg-green-600 text-white">Registrar Consumo</Button><Button onClick={() => {resetSharedModal(); setIsPagoOpen(true)}} className="bg-orange-500 hover:bg-orange-600 text-white">Pago de Consumo</Button></div><div className="flex gap-4 ml-auto"><Button onClick={() => setIsGananciaOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><TrendingUp className="mr-2 h-4 w-4" />Ganancia Actual</Button><Button variant="secondary" onClick={handleOpenReportModal}><FileText className="mr-2 h-4 w-4" />Reportes</Button></div></div>
      <div><h3 className="text-lg font-semibold">Mis Clientes</h3><Input placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="my-4"/><div className="mt-2 space-y-2">{clientesFiltrados.length > 0 ? (clientesFiltrados.map(cliente => (<button key={cliente.id} onClick={() => handleOpenDetail(cliente)} className="w-full text-left p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center"><div><p className="font-semibold">{cliente.nombre}</p><p className="text-xs text-muted-foreground">{cliente.cedula || 'N/A'}</p></div>{cliente.esVip && <Star className="h-4 w-4 text-yellow-500" />}</button>))) : (<p className="text-sm text-gray-500 mt-2 text-center">No se encontraron clientes.</p>)}</div></div>

      {/* --- SECCIÓN DE MODALES --- */}

      <Dialog open={isSolicitudOpen} onOpenChange={setIsSolicitudOpen}><DialogContent><DialogHeader><DialogTitle>Nueva Solicitud de Crédito</DialogTitle></DialogHeader><form onSubmit={handleSolicitudSubmit} className="space-y-4 pt-4"><div><Label htmlFor="nombre">Nombre del Cliente</Label><Input id="nombre" value={solicitudData.nombre} onChange={handleSolicitudChange} required /></div><div><Label htmlFor="cedula">Cédula</Label><Input id="cedula" value={solicitudData.cedula} onChange={handleSolicitudChange} /></div><div><Label htmlFor="direccion">Dirección</Label><Input id="direccion" value={solicitudData.direccion} onChange={handleSolicitudChange} /></div><div><Label htmlFor="contacto">Teléfono/Contacto</Label><Input id="contacto" value={solicitudData.contacto} onChange={handleSolicitudChange} /></div><div><Label htmlFor="montoCredito">Monto de Crédito Solicitado</Label><Input id="montoCredito" type="number" value={solicitudData.montoCredito} onChange={handleSolicitudChange} required /></div><DialogFooter><Button type="button" variant="ghost" onClick={() => setIsSolicitudOpen(false)}>Cancelar</Button><Button type="submit">Enviar Solicitud</Button></DialogFooter></form></DialogContent></Dialog>
      
      <Dialog open={isConsumoOpen} onOpenChange={(isOpen) => {if(!isOpen) resetSharedModal(); setIsConsumoOpen(isOpen)}}><DialogContent><DialogHeader><DialogTitle>Registrar Consumo</DialogTitle></DialogHeader>{!creditoEncontrado ? (<div className="space-y-4 pt-4"><Label htmlFor="consumo-credito-id">Ingresa el Código de Crédito</Label><div className="flex gap-2"><Input id="consumo-credito-id" value={creditoIdInput} onChange={(e) => setCreditoIdInput(e.target.value)} /><Button type="button" onClick={handleBuscarCredito}>Buscar</Button></div>{errorBusqueda && <p className="text-sm text-red-500">{errorBusqueda}</p>}</div>) : (<form onSubmit={handleConsumoSubmit} className="space-y-4 pt-4"><DialogDescription>Cliente: <span className="font-semibold">{clientes.find(c => c.id === creditoEncontrado.clienteId)?.nombre}</span> <br/>Saldo Disponible: <span className="font-semibold">${creditoEncontrado.saldoDisponible.toLocaleString()}</span></DialogDescription><div><Label htmlFor="monto">Monto del Consumo</Label><Input id="monto" type="number" value={consumoData.monto} onChange={(e) => setConsumoData(prev => ({...prev, monto: e.target.value}))} required /></div><div><Label htmlFor="descripcion">Descripción</Label><Input id="descripcion" value={consumoData.descripcion} onChange={(e) => setConsumoData(prev => ({...prev, descripcion: e.target.value}))} /></div><DialogFooter><Button type="button" variant="ghost" onClick={() => {resetSharedModal(); setIsConsumoOpen(false)}}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter></form>)}</DialogContent></Dialog>
      
      <Dialog open={isPagoOpen} onOpenChange={(isOpen) => {if(!isOpen) resetSharedModal(); setIsPagoOpen(isOpen)}}><DialogContent><DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>{!creditoEncontrado ? (<div className="space-y-4 pt-4"><Label htmlFor="pago-credito-id">Ingresa el Código de Crédito</Label><div className="flex gap-2"><Input id="pago-credito-id" value={creditoIdInput} onChange={(e) => setCreditoIdInput(e.target.value)} /><Button type="button" onClick={handleBuscarCredito}>Buscar</Button></div>{errorBusqueda && <p className="text-sm text-red-500">{errorBusqueda}</p>}</div>) : (<form onSubmit={handlePagoSubmit} className="space-y-4 pt-4"><DialogDescription>Cliente: <span className="font-semibold">{clientes.find(c => c.id === creditoEncontrado.clienteId)?.nombre}</span> <br/>Deuda Total: <span className="font-semibold text-red-600">${((creditoEncontrado.montoAprobado - creditoEncontrado.saldoDisponible) + (creditoEncontrado.interesAdeudado || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}</span></DialogDescription><div><Label htmlFor="monto-pago">Monto a Pagar</Label><Input id="monto-pago" type="number" value={pagoData.monto} onChange={(e) => setPagoData({monto: e.target.value})} required /></div><DialogFooter><Button type="button" variant="ghost" onClick={() => {resetSharedModal(); setIsPagoOpen(false)}}>Cancelar</Button><Button type="submit">Registrar Pago</Button></DialogFooter></form>)}</DialogContent></Dialog>
      
      <Dialog open={isGananciaOpen} onOpenChange={setIsGananciaOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp />Resumen de Ganancia del Colmado</DialogTitle><DialogDescription>Cálculo de la ganancia obtenida basada en el 3.5% del interés cobrado a los clientes.</DialogDescription></DialogHeader><div className="py-4 text-center"><p className="text-sm text-muted-foreground">Interés Total Cobrado de sus Clientes</p><p className="text-2xl font-semibold">${interesTotalRecaudado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p><p className="text-sm text-muted-foreground mt-4">Su Ganancia (3.5% del interés)</p><p className="text-4xl font-bold text-green-600">${gananciaColmado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><DialogFooter><Button onClick={() => setIsGananciaOpen(false)}>Cerrar</Button></DialogFooter></DialogContent></Dialog>
      
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}><DialogContent className="max-w-2xl">{detailData && (<><DialogHeader><DialogTitle className="text-2xl">{detailData.cliente.nombre}</DialogTitle><DialogDescription>Cédula: {detailData.cliente.cedula || 'N/A'}</DialogDescription></DialogHeader>{detailData.credito ? (<div className="py-4 space-y-6"><div><h4 className="font-semibold mb-2 text-lg">Resumen del Crédito</h4><div className="p-4 border rounded-lg grid grid-cols-2 gap-4 bg-gray-50"><div><p className="text-sm text-gray-500">ID de Crédito</p><p className="font-mono bg-gray-200 px-2 py-1 rounded-md text-sm">{detailData.credito.id}</p></div><div><p className="text-sm text-gray-500">Estado</p><p className="font-semibold text-green-600 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>Activo</p></div><div><p className="text-sm text-gray-500">Crédito Otorgado</p><p className="font-semibold text-base">${detailData.credito.montoAprobado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><div><p className="text-sm text-gray-500">Saldo Disponible</p><p className="font-semibold text-base">${detailData.credito.saldoDisponible.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div><div className="col-span-2 border-t pt-4 mt-2"><p className="text-sm text-gray-500">Deuda Total (Capital + Interés)</p><p className="text-xl font-bold text-red-600">${((detailData.credito.montoAprobado - detailData.credito.saldoDisponible) + (detailData.credito.interesAdeudado || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div></div></div><div><h4 className="font-semibold mb-2 text-lg">Historial de Consumos</h4><div className="border rounded-lg max-h-40 overflow-y-auto">{detailData.consumos?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Interés</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>{detailData.consumos.map(cons => (<TableRow key={cons.id}><TableCell>{new Date(cons.fecha).toLocaleDateString('es-DO')}</TableCell><TableCell>{cons.descripcion}</TableCell><TableCell>${(cons.interesGenerado || 0).toFixed(2)}</TableCell><TableCell className="text-right">${cons.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>))}</TableBody></Table>) : <p className="p-6 text-center text-gray-500">No se han registrado consumos.</p>}</div></div><div><h4 className="font-semibold mb-2 text-lg">Historial de Pagos</h4><div className="border rounded-lg max-h-40 overflow-y-auto">{detailData.pagos?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>A Interés</TableHead><TableHead>A Capital</TableHead><TableHead className="text-right font-semibold">Monto Total</TableHead></TableRow></TableHeader><TableBody>{detailData.pagos.map(pago => (<TableRow key={pago.id}><TableCell>{new Date(pago.fecha).toLocaleDateString('es-DO')}</TableCell><TableCell className="text-right">${(pago.montoInteres || 0).toFixed(2)}</TableCell><TableCell className="text-right">${(pago.montoCapital || 0).toFixed(2)}</TableCell><TableCell className="text-right text-green-600 font-medium">+ ${pago.montoTotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>))}</TableBody></Table>) : <p className="p-6 text-center text-gray-500">No se han registrado pagos.</p>}</div></div></div>) : <p className="py-4">Este cliente no tiene un crédito activo.</p>}<DialogFooter><Button variant="outline" onClick={handlePrintReport}><Printer className="mr-2 h-4 w-4" />Imprimir Resumen</Button></DialogFooter></>)}</DialogContent></Dialog>
      
      <Dialog open={isReportesOpen} onOpenChange={setIsReportesOpen}>
        <DialogContent className="max-w-4xl">
          {reportStep === 'selection' && (
            <><DialogHeader><DialogTitle>Generar Nuevo Reporte</DialogTitle><DialogDescription>Seleccione el tipo de reporte que desea generar.</DialogDescription></DialogHeader><div className="py-4 space-y-2"><Label htmlFor="report-type">Tipo de Reporte</Label><Select onValueChange={(value) => setTipoReporte(value)}><SelectTrigger id="report-type"><SelectValue placeholder="Elija una opción..." /></SelectTrigger><SelectContent><SelectItem value="consumos_clientes">1. Reporte de Consumos de Clientes</SelectItem><SelectItem value="ganancias_colmado">2. Reporte de Ganancias (3.5%)</SelectItem><SelectItem value="estado_cuenta_cliente">3. Estado de Cuenta de Cliente</SelectItem></SelectContent></Select></div><DialogFooter><Button variant="ghost" onClick={() => setIsReportesOpen(false)}>Cancelar</Button><Button onClick={handleSelectReportType}>Aceptar y Continuar</Button></DialogFooter></>
          )}
          {reportStep === 'filters' && (
            <><DialogHeader><DialogTitle>{reportTitles[tipoReporte]}</DialogTitle><DialogDescription>Seleccione los filtros para generar el reporte.</DialogDescription></DialogHeader><div className="py-4 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Fecha de Inicio</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange.from ? format(dateRange.from, "PPP") : <span>Elija una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({...prev, from: date}))} initialFocus /></PopoverContent></Popover></div><div className="space-y-2"><Label>Fecha Final</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange.to ? format(dateRange.to, "PPP") : <span>Elija una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({...prev, to: date}))} initialFocus /></PopoverContent></Popover></div></div>{tipoReporte === 'estado_cuenta_cliente' && (<div className="space-y-2"><Label htmlFor="search-cliente">Buscar Cliente por Nombre</Label><Input id="search-cliente" placeholder="Escriba el nombre del cliente..." value={reporteSearchTerm} onChange={(e) => setReporteSearchTerm(e.target.value)} /></div>)}</div><DialogFooter><Button variant="ghost" onClick={() => setReportStep('selection')}>Atrás</Button><Button onClick={handleFinalReportGeneration}>Generar Reporte</Button></DialogFooter></>
          )}
          {reportStep === 'results' && (
            <><div className="printable-area"><DialogHeader><DialogTitle className="text-2xl">{reportTitles[tipoReporte]}</DialogTitle><DialogDescription>Mostrando resultados desde {dateRange.from ? format(dateRange.from, "PPP") : ''} hasta {dateRange.to ? format(dateRange.to, "PPP") : ''}.{tipoReporte === 'estado_cuenta_cliente' && reporteResultados?.cliente && ` para el cliente: ${reporteResultados.cliente.nombre}`}</DialogDescription></DialogHeader><div className="py-4 max-h-[60vh] overflow-y-auto">{(!reporteResultados || (Array.isArray(reporteResultados) && reporteResultados.length === 0)) && <p className="text-center text-muted-foreground py-8">No se encontraron resultados para los filtros seleccionados.</p>}{tipoReporte === 'consumos_clientes' && reporteResultados?.length > 0 && (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>{reporteResultados.map(item => (<TableRow key={item.id}><TableCell>{format(new Date(item.fecha), 'P')}</TableCell><TableCell>{item.nombreCliente}</TableCell><TableCell>{item.descripcion}</TableCell><TableCell className="text-right">${item.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>))}</TableBody></Table>)}{tipoReporte === 'ganancias_colmado' && reporteResultados && (<div className="text-center p-8 bg-gray-50 rounded-lg"><p className="text-sm text-muted-foreground">Interés Total Cobrado en el Período</p><p className="text-2xl font-semibold">${reporteResultados.interesTotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p><p className="text-sm text-muted-foreground mt-6">Su Ganancia Neta (3.5%)</p><p className="text-5xl font-bold text-green-600">${reporteResultados.ganancia.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p></div>)}{tipoReporte === 'estado_cuenta_cliente' && reporteResultados && (<div><h3 className="text-lg font-semibold mb-4">Cliente: <span className="font-normal">{reporteResultados.cliente.nombre}</span></h3><h4 className="font-semibold my-2">Consumos Realizados</h4>{reporteResultados.consumos.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>{reporteResultados.consumos.map(item => <TableRow key={item.id}><TableCell>{format(new Date(item.fecha), 'P')}</TableCell><TableCell>{item.descripcion}</TableCell><TableCell className="text-right">${item.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>)}</TableBody></Table>) : (<p className="text-sm text-muted-foreground p-4">No hay consumos en este período.</p>)}<h4 className="font-semibold my-2 mt-4">Pagos Realizados</h4>{reporteResultados.pagos.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>{reporteResultados.pagos.map(item => <TableRow key={item.id}><TableCell>{format(new Date(item.fecha), 'P')}</TableCell><TableCell className="text-right text-green-600 font-medium">+ ${item.montoTotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell></TableRow>)}</TableBody></Table>) : (<p className="text-sm text-muted-foreground p-4">No hay pagos en este período.</p>)}</div>)}</div></div><DialogFooter className="no-print pt-4 border-t"><Button variant="ghost" onClick={() => setReportStep('filters')}>Atrás</Button><Button onClick={handlePrintReport}><Printer className="mr-2 h-4 w-4" />Imprimir</Button></DialogFooter></>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColmadoDashboard;