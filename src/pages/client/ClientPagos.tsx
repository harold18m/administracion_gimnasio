import { useClientAuth } from "@/hooks/useClientAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, DollarSign } from "lucide-react";

export default function ClientPagos() {
  const { cliente } = useClientAuth();
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cliente?.id) {
      fetchPagos();
    }
  }, [cliente?.id]);

  const fetchPagos = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cliente_id', cliente?.id)
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setPagos(data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Mis Pagos</h1>
      
      {pagos.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No tienes pagos registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pagos.map((pago) => (
            <Card key={pago.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">
                    {pago.tipo === 'cuota' ? `Cuota ${pago.numero_cuota || ''}` : 
                     pago.tipo === 'adelanto' ? 'Adelanto' : 
                     pago.tipo === 'pago_completo' ? 'Pago Completo' : 'Pago'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(new Date(pago.fecha_transaccion), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                      {pago.metodo_pago}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">
                    S/ {pago.monto.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed bottom-10 right-4 w-40 z-0 pointer-events-none opacity-100 filter drop-shadow-lg">
          <img 
              src="/images/erizo_pagos.webp" 
              alt="Erizo Pagos" 
              className="w-full h-auto"
          />
      </div>
    </div>
  );
}
