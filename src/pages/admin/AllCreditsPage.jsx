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
import { CreditCard, Calendar as CalendarIcon, Search } from "lucide-react";

const AllCreditsPage = () => {
  const { creditos, clientes, colmados } = useAppContext();

  // --- Estados para los filtros ---
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // --- Lógica de filtrado ---
  const filteredCredits = creditos
    .filter(credito => {
      // Filtro por fecha
      if (dateRange.from && dateRange.to) {
        const fechaSolicitud = new Date(credito.fechaSolicitud);
        // Ajustar la hora para asegurar que el rango sea inclusivo
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (fechaSolicitud < fromDate || fechaSolicitud > toDate) {
          return false;
        }
      }

      // Filtro por término de búsqueda
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const cliente = clientes.find(c => c.id === credito.clienteId);
        const colmado = colmados.find(co => co.id === credito.colmadoId);

        const clienteMatch = cliente?.nombre.toLowerCase().includes(lowerCaseSearchTerm);
        const colmadoMatch = colmado?.nombre.toLowerCase().includes(lowerCaseSearchTerm);
        const estadoMatch = credito.estado.toLowerCase().includes(lowerCaseSearchTerm);
        
        return clienteMatch || colmadoMatch || estadoMatch;
      }

      return true; // Si no hay filtros, mostrar todo
    })
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)); // Ordenar por fecha


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Historial de Todos los Créditos
          </h1>
          <p className="text-muted-foreground">
            Visualiza y filtra todos los créditos otorgados en el sistema.
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
                    placeholder="Buscar por cliente, colmado o estado..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full md:w-[300px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccione un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Resultados ({filteredCredits.length} de {creditos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Colmado</TableHead>
                <TableHead>Monto Aprobado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Solicitud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length > 0 ? (
                filteredCredits.map(credito => {
                  const cliente = clientes.find(c => c.id === credito.clienteId);
                  const colmado = colmados.find(co => co.id === credito.colmadoId);
                  return (
                    <TableRow key={credito.id}>
                      <TableCell className="font-medium">{cliente?.nombre || 'N/A'}</TableCell>
                      <TableCell>{colmado?.nombre || 'Cliente VIP'}</TableCell>
                      <TableCell>${credito.montoAprobado.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          credito.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          credito.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {credito.estado}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(credito.fechaSolicitud).toLocaleDateString('es-DO')}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="5" className="text-center h-24">No se encontraron créditos con los filtros aplicados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllCreditsPage;