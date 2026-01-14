import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CreditCard, Calendar, Wallet } from "lucide-react";
import { format, addMonths, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";

type ClienteRow = Database['public']['Tables']['clientes']['Row'];

interface Membresia {
  id: string;
  nombre: string;
  precio: number;
  tipo: string;
  modalidad: string;
  duracion?: number;
}

interface RenovarMembresiaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteRow | null;
  membresiasDisponibles: Membresia[];
  onRenovacionExitosa: () => void;
}

export function RenovarMembresiaModal({
  isOpen,
  onOpenChange,
  cliente,
  membresiasDisponibles,
  onRenovacionExitosa
}: RenovarMembresiaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [membresiaId, setMembresiaId] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState<string>("");
  
  // Estados de pago
  const [pagoEnCuotas, setPagoEnCuotas] = useState(false);
  const [montoAdelanto, setMontoAdelanto] = useState<number>(0);
  const [numCuotas, setNumCuotas] = useState<number>(1);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");

  // Membresía seleccionada
  const membresiaSeleccionada = membresiasDisponibles.find(m => m.id === membresiaId);
  const precioMembresia = membresiaSeleccionada?.precio || 0;
  const saldoPendiente = precioMembresia - montoAdelanto;

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (isOpen && cliente) {
      setMembresiaId(cliente.membresia_id || "");
      setFechaInicio(format(new Date(), "yyyy-MM-dd"));
      setPagoEnCuotas(false);
      setMontoAdelanto(0);
      setNumCuotas(1);
      setMetodoPago("efectivo");
    }
  }, [isOpen, cliente]);

  // Calcular fecha de vencimiento automáticamente
  useEffect(() => {
    if (membresiaSeleccionada && membresiaSeleccionada.duracion && fechaInicio) {
      const fecha = addMonths(new Date(fechaInicio), membresiaSeleccionada.duracion);
      setFechaFin(format(fecha, "yyyy-MM-dd"));
    }
  }, [membresiaId, fechaInicio, membresiaSeleccionada]);

  // Resetear cuotas cuando cambia membresía
  useEffect(() => {
    setMontoAdelanto(0);
    setPagoEnCuotas(false);
  }, [membresiaId]);

  const handleRenovar = async () => {
    if (!cliente || !membresiaSeleccionada) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona una membresía"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Actualizar cliente con nueva membresía
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({
          membresia_id: membresiaId,
          nombre_membresia: membresiaSeleccionada.nombre,
          tipo_membresia: membresiaSeleccionada.modalidad,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: 'activa'
        })
        .eq('id', cliente.id);

      if (clienteError) throw clienteError;

      // 2. Crear registro de pago
      const { data: pagoData, error: pagoError } = await supabase
        .from('pagos')
        .insert({
          cliente_id: cliente.id,
          membresia_id: membresiaId,
          monto_total: precioMembresia,
          monto_pagado: pagoEnCuotas ? montoAdelanto : precioMembresia,
          nombre_membresia: membresiaSeleccionada.nombre,
          num_cuotas: pagoEnCuotas ? numCuotas : 0,
          estado: pagoEnCuotas && saldoPendiente > 0 ? 'parcial' : 'pagado',
          notas: `Renovación de membresía${pagoEnCuotas ? ` - Adelanto: S/ ${montoAdelanto.toFixed(2)}` : ''}`
        })
        .select()
        .single();

      if (pagoError) {
        console.error('Error al crear pago:', pagoError);
      } else if (pagoData) {
        // 3. Crear transacción inicial
        const montoInicial = pagoEnCuotas ? montoAdelanto : precioMembresia;
        if (montoInicial > 0) {
          await supabase
            .from('transacciones')
            .insert({
              pago_id: pagoData.id,
              cliente_id: cliente.id,
              monto: montoInicial,
              tipo: pagoEnCuotas ? 'adelanto' : 'pago_completo',
              metodo_pago: metodoPago,
              notas: 'Pago por renovación de membresía'
            });
        }
      }

      toast({
        title: "Membresía renovada",
        description: `La membresía de ${cliente.nombre} ha sido renovada correctamente.`
      });

      onRenovacionExitosa();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo renovar la membresía"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5 rounded-t-lg">
          <DialogHeader className="items-center text-center text-white">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Renovar Membresía
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {cliente.nombre}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info actual */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Membresía actual</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{cliente.nombre_membresia || 'Sin membresía'}</p>
                <p className="text-xs text-muted-foreground">
                  {cliente.fecha_fin ? `Vence: ${format(new Date(cliente.fecha_fin), 'dd/MM/yyyy')}` : 'Sin fecha de vencimiento'}
                </p>
              </div>
              <Badge variant={cliente.estado === 'activa' ? 'default' : 'destructive'}>
                {cliente.estado === 'activa' ? 'Activa' : cliente.estado === 'vencida' ? 'Vencida' : cliente.estado}
              </Badge>
            </div>
          </div>

          {/* Nueva membresía */}
          <div>
            <Label className="text-sm font-medium">Nueva membresía</Label>
            <Select value={membresiaId} onValueChange={setMembresiaId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecciona una membresía" />
              </SelectTrigger>
              <SelectContent>
                {membresiasDisponibles.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{m.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.tipo} • {m.modalidad} • S/ {m.precio}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Fecha inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha vencimiento</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Sección de pago */}
          {membresiaSeleccionada && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <Label className="font-medium">Pago en cuotas</Label>
                </div>
                <Switch
                  checked={pagoEnCuotas}
                  onCheckedChange={setPagoEnCuotas}
                />
              </div>

              {!pagoEnCuotas && (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio total:</span>
                    <span className="font-bold text-lg">S/ {precioMembresia.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {pagoEnCuotas && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Precio total</Label>
                      <div className="text-lg font-bold">S/ {precioMembresia.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm">Saldo pendiente</Label>
                      <div className="text-lg font-bold text-orange-600">
                        S/ {saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Monto de adelanto (S/)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={precioMembresia}
                      value={montoAdelanto}
                      onChange={(e) => setMontoAdelanto(Math.min(parseFloat(e.target.value) || 0, precioMembresia))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Número de cuotas (máx. 2)</Label>
                    <Select value={String(numCuotas)} onValueChange={(v) => setNumCuotas(Number(v))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 cuota</SelectItem>
                        <SelectItem value="2">2 cuotas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {saldoPendiente > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Plan de cuotas semanales:</p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        {Array.from({ length: numCuotas }, (_, i) => {
                          const montoCuota = saldoPendiente / numCuotas;
                          const fechaCuota = addDays(new Date(), (i + 1) * 7);
                          return (
                            <li key={i} className="flex justify-between">
                              <span>Cuota {i + 1} - {format(fechaCuota, 'dd/MM/yyyy')}</span>
                              <span className="font-medium">S/ {montoCuota.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm">Método de pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="plin">Plin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRenovar} 
            disabled={loading || !membresiaId}
            className="bg-gradient-to-r from-green-600 to-emerald-500"
          >
            {loading ? "Renovando..." : "Renovar Membresía"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
