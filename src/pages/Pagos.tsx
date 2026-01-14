import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Search, 
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Pago {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  membresia_id: string | null;
  monto_total: number;
  monto_pagado: number;
  nombre_membresia: string | null;
  fecha_inicio: string;
  estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  num_cuotas: number;
  notas: string | null;
  created_at: string;
}

interface Transaccion {
  id: string;
  pago_id: string;
  cliente_id: string;
  monto: number;
  tipo: 'adelanto' | 'cuota' | 'pago_completo';
  numero_cuota: number | null;
  metodo_pago: string;
  fecha_transaccion: string;
  notas: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
}

export default function Pagos() {
  const { toast } = useToast();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  
  // Modal de nuevo pago de cuota
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [montoCuota, setMontoCuota] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [notasPago, setNotasPago] = useState<string>("");
  
  // Modal de historial de transacciones
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [transaccionesPago, setTransaccionesPago] = useState<Transaccion[]>([]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar pagos con nombre de cliente
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select(`
          *,
          clientes (nombre)
        `)
        .order('created_at', { ascending: false });

      if (pagosError) throw pagosError;

      const pagosConNombre = (pagosData || []).map(p => ({
        ...p,
        cliente_nombre: (p.clientes as any)?.nombre || 'Sin nombre'
      }));
      
      setPagos(pagosConNombre);

      // Cargar clientes para selector
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nombre')
        .order('nombre');
      
      setClientes(clientesData || []);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarTransaccionesPago = async (pagoId: string) => {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('pago_id', pagoId)
      .order('fecha_transaccion', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las transacciones"
      });
      return;
    }

    setTransaccionesPago(data || []);
    setModalHistorialAbierto(true);
  };

  const registrarPagoCuota = async () => {
    if (!pagoSeleccionado || montoCuota <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa un monto válido"
      });
      return;
    }

    const pendiente = pagoSeleccionado.monto_total - pagoSeleccionado.monto_pagado;
    if (montoCuota > pendiente) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `El monto no puede ser mayor a S/ ${pendiente.toFixed(2)}`
      });
      return;
    }

    try {
      // Determinar número de cuota
      const { data: transCount } = await supabase
        .from('transacciones')
        .select('id')
        .eq('pago_id', pagoSeleccionado.id)
        .eq('tipo', 'cuota');

      const numeroCuota = (transCount?.length || 0) + 1;

      const { error } = await supabase
        .from('transacciones')
        .insert({
          pago_id: pagoSeleccionado.id,
          cliente_id: pagoSeleccionado.cliente_id,
          monto: montoCuota,
          tipo: 'cuota',
          numero_cuota: numeroCuota,
          metodo_pago: metodoPago,
          notas: notasPago || null
        });

      if (error) throw error;

      toast({
        title: "Pago registrado",
        description: `Cuota ${numeroCuota} de S/ ${montoCuota.toFixed(2)} registrada correctamente`
      });

      setModalPagoAbierto(false);
      setPagoSeleccionado(null);
      setMontoCuota(0);
      setNotasPago("");
      cargarDatos();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el pago"
      });
    }
  };

  const abrirModalPago = (pago: Pago) => {
    setPagoSeleccionado(pago);
    const pendiente = pago.monto_total - pago.monto_pagado;
    setMontoCuota(pendiente);
    setModalPagoAbierto(true);
  };

  const obtenerBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Pagado</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'pendiente':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const pagosFiltrados = pagos.filter(pago => {
    const coincideBusqueda = 
      pago.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      pago.nombre_membresia?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === "todos" || pago.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  const resumen = {
    totalPendiente: pagos.reduce((acc, p) => acc + (p.monto_total - p.monto_pagado), 0),
    totalCobrado: pagos.reduce((acc, p) => acc + p.monto_pagado, 0),
    clientesConDeuda: pagos.filter(p => p.estado !== 'pagado').length,
    pagosCompletos: pagos.filter(p => p.estado === 'pagado').length
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Pagos y Cuotas</h1>
            <p className="text-muted-foreground text-sm">
              Gestiona los pagos y cuotas de membresías
            </p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-xl font-bold text-yellow-600">S/ {resumen.totalPendiente.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobrado</p>
                <p className="text-xl font-bold text-green-600">S/ {resumen.totalCobrado.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Con Deuda</p>
                <p className="text-xl font-bold">{resumen.clientesConDeuda}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagados</p>
                <p className="text-xl font-bold">{resumen.pagosCompletos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o membresía..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Planes de Pago</CardTitle>
          <CardDescription>
            Lista de membresías con sus pagos y cuotas pendientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pagos registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Membresía</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosFiltrados.map((pago) => {
                    const pendiente = pago.monto_total - pago.monto_pagado;
                    return (
                      <TableRow key={pago.id}>
                        <TableCell className="font-medium">{pago.cliente_nombre}</TableCell>
                        <TableCell>{pago.nombre_membresia || '-'}</TableCell>
                        <TableCell className="text-right">S/ {pago.monto_total.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600">S/ {pago.monto_pagado.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {pendiente > 0 ? `S/ ${pendiente.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>{obtenerBadgeEstado(pago.estado)}</TableCell>
                        <TableCell>{pago.num_cuotas} cuotas</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cargarTransaccionesPago(pago.id)}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            {pago.estado !== 'pagado' && (
                              <Button
                                size="sm"
                                onClick={() => abrirModalPago(pago)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Pago
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para registrar pago */}
      <Dialog open={modalPagoAbierto} onOpenChange={setModalPagoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago de Cuota</DialogTitle>
            <DialogDescription>
              {pagoSeleccionado && (
                <>
                  Cliente: <strong>{pagoSeleccionado.cliente_nombre}</strong><br />
                  Pendiente: <strong className="text-orange-600">
                    S/ {(pagoSeleccionado.monto_total - pagoSeleccionado.monto_pagado).toFixed(2)}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="monto">Monto a pagar (S/)</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={montoCuota}
                onChange={(e) => setMontoCuota(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="metodo">Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
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

            <div>
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notasPago}
                onChange={(e) => setNotasPago(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPagoAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={registrarPagoCuota}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de historial de transacciones */}
      <Dialog open={modalHistorialAbierto} onOpenChange={setModalHistorialAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de Transacciones</DialogTitle>
            <DialogDescription>
              Detalle de todos los pagos realizados
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {transaccionesPago.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay transacciones registradas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaccionesPago.map((trans) => (
                    <TableRow key={trans.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(trans.fecha_transaccion), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(trans.fecha_transaccion), 'HH:mm:ss', { locale: es })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trans.tipo === 'adelanto' && 'Adelanto'}
                          {trans.tipo === 'cuota' && `Cuota ${trans.numero_cuota}`}
                          {trans.tipo === 'pago_completo' && 'Pago Completo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{trans.metodo_pago}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        S/ {trans.monto.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {trans.notas || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalHistorialAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
