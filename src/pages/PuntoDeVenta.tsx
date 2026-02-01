import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, ScanBarcode, Minus, Plus, X } from "lucide-react";
import { useProductos } from "@/hooks/useProductos";
import { useVentas } from "@/hooks/useVentas";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// import { useClientes } from "@/hooks/useClientes";

export default function PuntoDeVenta() {
    const { productos, fetchProductos } = useProductos();
    const { registrarVenta, loading: procesando } = useVentas();
    // const { clientes } = useClientes(); // Descomentar si existe hook de clientes global o implementar uno simple aquí

    const [searchTerm, setSearchTerm] = useState("");
    const [carrito, setCarrito] = useState<{producto: any, cantidad: number}[]>([]); // TODO: Use Producto type
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [pagoDialogoOpen, setPagoDialogoOpen] = useState(false);
    const [montoRecibido, setMontoRecibido] = useState("");

    const productosFiltrados = useMemo(() => {
        return productos.filter(p => 
            p.activo && p.stock_actual > 0 &&
            (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
             p.codigo_barras?.includes(searchTerm))
        );
    }, [productos, searchTerm]);

    const agregarAlCarrito = (producto: any) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.producto.id === producto.id);
            if (existe) {
                if (existe.cantidad >= producto.stock_actual) return prev; // Límite stock
                return prev.map(item => item.producto.id === producto.id ? {...item, cantidad: item.cantidad + 1} : item);
            }
            return [...prev, { producto, cantidad: 1 }];
        });
    };

    const removerDelCarrito = (productoId: string) => {
        setCarrito(prev => prev.filter(item => item.producto.id !== productoId));
    };

    const cambiarCantidad = (productoId: string, delta: number) => {
        setCarrito(prev => prev.map(item => {
            if (item.producto.id === productoId) {
                const nuevaCantidad = item.cantidad + delta;
                if (nuevaCantidad <= 0) return item; // No bajar de 1 aquí, usar eliminar
                if (nuevaCantidad > item.producto.stock_actual) return item; // Stock limit
                return { ...item, cantidad: nuevaCantidad };
            }
            return item;
        }));
    };

    const total = carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

    const handleCheckout = async () => {
        if (carrito.length === 0) return;
        
        const itemsVenta = carrito.map(item => ({
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio,
            nombre: item.producto.nombre
        }));

        const result = await registrarVenta(itemsVenta, total, metodoPago, null); // Cliente null por ahora

        if (result.success) {
            setCarrito([]);
            setPagoDialogoOpen(false);
            setMontoRecibido("");
            fetchProductos(); // Actualizar stock visual
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] flex-col md:flex-row gap-4 p-4 overflow-hidden">
            {/* Panel Izquierdo: Productos */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar producto por nombre o código..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 text-lg"
                        autoFocus
                    />
                    <ScanBarcode className="h-5 w-5 text-muted-foreground cursor-pointer" />
                </div>

                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {productosFiltrados.map(prod => (
                            <Card 
                                key={prod.id} 
                                className="cursor-pointer hover:border-primary transition-all active:scale-95"
                                onClick={() => agregarAlCarrito(prod)}
                            >
                                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                     <div className="h-24 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground object-cover">
                                        {prod.imagen_url ? <img src={prod.imagen_url} alt={prod.nombre} className="h-full w-full object-cover rounded-md"/> : <ScanBarcode className="h-8 w-8"/>}
                                     </div>
                                     <div className="font-semibold leading-tight line-clamp-2">{prod.nombre}</div>
                                     <Badge variant="secondary" className="mt-1">S/ {prod.precio.toFixed(2)}</Badge>
                                     <div className="text-xs text-muted-foreground">Stock: {prod.stock_actual}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Panel Derecho: Carrito */}
            <div className="w-full md:w-[400px] flex flex-col bg-card border rounded-xl shadow-lg h-full">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <ShoppingCart className="h-5 w-5" />
                        Carrito
                    </div>
                    {carrito.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setCarrito([])} className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <ShoppingCart className="h-16 w-16 mb-4" />
                            <p>Carrito vacío</p>
                            <p className="text-sm">Escanea o selecciona productos</p>
                        </div>
                    ) : (
                        carrito.map((item) => (
                            <div key={item.producto.id} className="flex gap-3 items-start p-3 rounded-lg border bg-background/50">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{item.producto.nombre}</div>
                                    <div className="text-sm text-muted-foreground">S/ {item.producto.precio.toFixed(2)} x {item.cantidad}</div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); cambiarCantidad(item.producto.id, -1); }}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm">{item.cantidad}</span>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); cambiarCantidad(item.producto.id, 1); }}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="font-bold">S/ {(item.producto.precio * item.cantidad).toFixed(2)}</div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removerDelCarrito(item.producto.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Dialog open={pagoDialogoOpen} onOpenChange={setPagoDialogoOpen}>
                        <DialogTrigger asChild>
                             <Button className="w-full text-lg py-6" size="lg" disabled={carrito.length === 0}>
                                Cobrar S/ {total.toFixed(2)}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Procesar Pago</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="text-center text-4xl font-bold mb-6">
                                    S/ {total.toFixed(2)}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        variant={metodoPago === "efectivo" ? "default" : "outline"} 
                                        onClick={() => setMetodoPago("efectivo")}
                                        className="h-20 flex flex-col gap-1"
                                    >
                                        <Banknote className="h-6 w-6" />
                                        Efectivo
                                    </Button>
                                    <Button 
                                        variant={metodoPago === "tarjeta" ? "default" : "outline"} 
                                        onClick={() => setMetodoPago("tarjeta")}
                                        className="h-20 flex flex-col gap-1"
                                    >
                                        <CreditCard className="h-6 w-6" />
                                        Tarjeta
                                    </Button>
                                    <Button 
                                        variant={metodoPago === "yape" ? "default" : "outline"} 
                                        onClick={() => setMetodoPago("yape")}
                                        className="h-20 flex flex-col gap-1"
                                    >
                                        <span className="font-bold text-xl text-purple-600">Y</span>
                                        Yape
                                    </Button>
                                    <Button 
                                        variant={metodoPago === "plin" ? "default" : "outline"} 
                                        onClick={() => setMetodoPago("plin")}
                                        className="h-20 flex flex-col gap-1"
                                    >
                                        <span className="font-bold text-xl text-blue-500">P</span>
                                        Plin
                                    </Button>
                                </div>

                                {metodoPago === "efectivo" && (
                                    <div className="space-y-2">
                                        <Label>Monto Recibido</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="number" 
                                                value={montoRecibido} 
                                                onChange={e => setMontoRecibido(e.target.value)}
                                                placeholder="0.00" 
                                                className="text-lg"
                                            />
                                        </div>
                                        {Number(montoRecibido) > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-green-900/20 text-green-400 rounded-lg border border-green-900/30">
                                                <span className="font-medium">Vuelto:</span>
                                                <span className="font-bold text-xl">
                                                    S/ {Math.max(0, Number(montoRecibido) - total).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <Button className="w-full py-6 text-lg" onClick={handleCheckout} disabled={procesando}>
                                    {procesando ? "Procesando..." : "Confirmar Venta"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
