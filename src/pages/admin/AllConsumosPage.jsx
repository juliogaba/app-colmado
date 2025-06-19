import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ShoppingCart, Calendar as CalendarIcon, Search } from "lucide-react";

const AllConsumosPage = () => {
  const { consumos, creditos, clientes } = useAppContext();

  // --- Estados para los filtros ---
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // --- Lógica de filtrado ---
  const filteredConsumos = consumos
    .filter(consumo => {
      // Filtro por fecha
      if (dateRange.from && dateRange.to) {
        const fechaConsumo = new Date(consumo.fecha);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (fechaConsumo < fromDate || fechaConsumo > toDate) {
          return false;
        }
      }

      // Filtro por término de búsqueda
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const credito = creditos.find(c => c.id === consumo.creditoId);
        const cliente = clientes.find(cl => cl.id === credito?.clienteId);

        const clienteMatch = cliente?.nombre.toLowerCase().includes(lowerCaseSearchTerm);
        const descripcionMatch = consumo.descripcion?.toLowerCase().includes(lowerCaseSearchTerm);

        return clienteMatch || descripcionMatch;
      }

      return true;
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Historial de Todos los Consumos
          </h1>
          <p className="text-muted-foreground">
            Visualiza y filtra todas las transacciones de consumo.
          </p>
        </div>
      </div>

      {/* --- SECCIÓN DE FILTROS --- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o descripción..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full md:w-[300px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (dateRange.to ? (`${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`) : format(dateRange.from, "LLL dd, y")) : (<span>Seleccione un rango de fechas</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados ({filteredConsumos.length} de {consumos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConsumos.length > 0 ? (
                filteredConsumos.map(consumo => {
                  const credito = creditos.find(c => c.id === consumo.creditoId);
                  const cliente = clientes.find(cl => cl.id === credito?.clienteId);
                  return (
                    <TableRow key={consumo.id}>
                      <TableCell>{new Date(consumo.fecha).toLocaleString('es-DO')}</TableCell>
                      <TableCell className="font-medium">{cliente?.nombre || 'N/A'}</TableCell>
                      <TableCell>{consumo.descripcion || 'Sin descripción'}</TableCell>
                      <TableCell className="text-right">${consumo.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="4" className="text-center h-24">No se encontraron consumos con los filtros aplicados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllConsumosPage;