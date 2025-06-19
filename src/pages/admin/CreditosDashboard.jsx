// src/pages/admin/CreditosDashboard.jsx

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

const CreditosDashboard = () => {
    const { pagos, clientes, creditos } = useAppContext();

    // --- CÁLCULO DE GANANCIA MES ACTUAL ---
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anoActual = hoy.getFullYear();

    // Filtramos los pagos que corresponden al mes y año actual
    const pagosDelMes = pagos.filter(pago => {
        const fechaPago = new Date(pago.fecha);
        return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anoActual;
    });

    // Sumamos la parte del interés de esos pagos
    const interesTotalMes = pagosDelMes.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);

    // Calculamos el 10% de esa suma de intereses
    const gananciaDiezPorciento = interesTotalMes * 0.10;

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Créditos</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Solicitar Nuevo Crédito
                </Button>
            </div>
            
            {/* Indicador de Ganancia Principal */}
            <div className="text-center bg-blue-500 text-white p-4 rounded-lg shadow-lg mb-8">
                <p className="font-semibold text-sm uppercase tracking-wider">GANANCIA ACTUAL, MES EN CURSO (10%)</p>
                <p className="text-5xl font-bold tracking-tight">${gananciaDiezPorciento.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
            </div>

            {/* Sección de Créditos de Clientes */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Todos los Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-8">(Aquí mostraremos la lista de clientes y el buscador)</p>
                </CardContent>
            </Card>

            {/* Sección de Ganancias Históricas */}
            <Card>
                <CardHeader>
                    <CardTitle>Ganancia Intereses por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-8">(Aquí mostraremos la lista de ganancias de meses anteriores y su buscador)</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreditosDashboard;