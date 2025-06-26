// Reemplaza por completo tu archivo src/pages/admin/CreditosDashboard.jsx con este código

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";

const CreditosDashboard = () => {
    // Usamos el 'AppContext' para obtener las funciones y datos necesarios
    const { pagos, adminCrearClienteYCredito } = useAppContext();
    
    // Estados para controlar el modal (ventana emergente) y su formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        cedula: '',
        direccion: '',
        telefono: '',
        monto: '',
        esVip: false
    });

    // --- Lógica para calcular la ganancia (esto ya lo tenías bien) ---
    const hoy = new Date();
    const pagosDelMes = pagos.filter(pago => {
        const fechaPago = new Date(pago.fecha);
        return fechaPago.getMonth() === hoy.getMonth() && fechaPago.getFullYear() === hoy.getFullYear();
    });
    const interesTotalMes = pagosDelMes.reduce((sum, pago) => sum + (pago.montoInteres || 0), 0);
    const gananciaDiezPorciento = interesTotalMes * 0.10;

    // --- Funciones para manejar el formulario ---
    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleCheckboxChange = (checked) => {
        setFormData(prev => ({ ...prev, esVip: checked }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.monto) {
            alert("El nombre y el monto del crédito son obligatorios.");
            return;
        }
        const dataFinal = {
            ...formData,
            monto: parseFloat(formData.monto)
        };
        // Llamamos a la función del context que guarda el cliente correctamente
        adminCrearClienteYCredito(dataFinal);
        
        setIsModalOpen(false); // Cierra el modal al guardar
        setFormData({ nombre: '', cedula: '', direccion: '', telefono: '', monto: '', esVip: false }); // Limpia el formulario
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Créditos</h1>
                {/* Este botón ahora SÍ abre el modal correcto */}
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Solicitar Nuevo Crédito
                </Button>
            </div>
            
            <div className="text-center bg-blue-500 text-white p-4 rounded-lg shadow-lg mb-8">
                <p className="font-semibold text-sm uppercase tracking-wider">GANANCIA ACTUAL, MES EN CURSO (10%)</p>
                <p className="text-5xl font-bold tracking-tight">${gananciaDiezPorciento.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
            </div>

            {/* El resto de tu dashboard... */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Todos los Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-8">(Aquí mostraremos la lista de clientes y el buscador)</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ganancia Intereses por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-8">(Aquí mostraremos la lista de ganancias de meses anteriores y su buscador)</p>
                </CardContent>
            </Card>

            {/* --- ESTE ES EL MODAL CORRECTO CON EL FORMULARIO COMPLETO --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Crédito para Cliente</DialogTitle>
                        <DialogDescription>
                            Llena los datos para crear un nuevo cliente y su primer crédito.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="nombre">Nombre del Cliente</Label>
                            <Input id="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="cedula">Cédula</Label>
                            <Input id="cedula" value={formData.cedula} onChange={handleInputChange} />
                        </div>
                         <div>
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input id="direccion" value={formData.direccion} onChange={handleInputChange} />
                        </div>
                         <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" value={formData.telefono} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="monto">Monto de Crédito Solicitado</Label>
                            <Input id="monto" type="number" value={formData.monto} onChange={handleInputChange} required />
                        </div>
                        {/* ESTA ES LA CASILLA QUE FALTABA */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="esVip" checked={formData.esVip} onCheckedChange={handleCheckboxChange} />
                            <Label htmlFor="esVip" className="font-bold text-purple-600">Es Cliente VIP</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Crear y Solicitar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreditosDashboard;