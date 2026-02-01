import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";
import { Venta } from "@/types";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const { tenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  // Moved fetchVentas inside useEffect to avoid dependency issues or use useCallback
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);
        if (!tenant?.id) return;
  
        const { data, error } = await supabase
          .from('ventas')
          .select(`
            *,
            cliente:clientes(nombre),
            items:detalle_ventas(
              id,
              cantidad,
              precio_unitario,
              subtotal,
              producto:productos(nombre)
            )
          `)
          .eq('tenant_id', tenant.id)
          .order('fecha', { ascending: false })
          .limit(50); 
  
        if (error) throw error;
        setVentas(data || []);
      } catch (error) {
        console.error("Error cargando ventas", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, [tenant?.id]);

  const ventasFiltradas = ventas.filter(v => 
    v.id.includes(searchTerm) || 
    v.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
           <p className="text-muted-foreground">Registro de todas las transacciones</p>
        </div>
      </div>

       <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Buscar por ID venta o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>ID Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : ventasFiltradas.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay ventas registradas</TableCell></TableRow>
              ) : (
                ventasFiltradas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-medium">
                      {venta.fecha ? format(new Date(venta.fecha), "dd MMM yyyy HH:mm", { locale: es }) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      #{venta.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {venta.cliente?.nombre || "Venta Casual"}
                    </TableCell>
                    <TableCell className="capitalize">{venta.metodo_pago}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      S/ {venta.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setVentaSeleccionada(venta)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!ventaSeleccionada} onOpenChange={(open) => !open && setVentaSeleccionada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {ventaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                   <span className="text-muted-foreground">Fecha:</span> <br/>
                   <span className="font-medium">{format(new Date(ventaSeleccionada.fecha), "dd MMM yyyy HH:mm", { locale: es })}</span>
                </div>
                 <div>
                   <span className="text-muted-foreground">Método Pago:</span> <br/>
                   <span className="capitalize font-medium">{ventaSeleccionada.metodo_pago}</span>
                </div>
              </div>
              
              <div className="border rounded-md p-2 bg-muted/20 space-y-2">
                 {ventaSeleccionada.items?.map((item: any) => ( // TODO: Fix type inferred from join
                   <div key={item.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-1 last:pb-0">
                      <div>
                        <div className="font-medium">{item.producto?.nombre || "Producto eliminado"}</div>
                        <div className="text-xs text-muted-foreground">{item.cantidad} x S/ {item.precio_unitario.toFixed(2)}</div>
                      </div>
                      <div className="font-bold">S/ {item.subtotal.toFixed(2)}</div>
                   </div>
                 ))}
                 <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>S/ {ventaSeleccionada.total.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
