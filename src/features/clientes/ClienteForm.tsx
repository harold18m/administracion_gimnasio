
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Cliente } from "./types";
import { format, addMonths, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { User2, Star, CalendarRange, QrCode, Wallet, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  // Email opcional: permitir cadena vacía y validar formato solo si hay valor
  email: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().email({ message: "Correo electrónico inválido" }).optional()
  ),
  telefono: z.string().min(9, { message: "El teléfono debe tener al menos 9 caracteres" }),
  dni: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{7,20}$/.test(val), {
      message: "El DNI debe contener entre 7 y 20 dígitos",
    }),
  fecha_nacimiento: z.string().min(1, { message: "La fecha de nacimiento es requerida" }),
  membresia_id: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  codigo_qr: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface ClienteFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  clienteActual: Cliente | null;
  membresiasDisponibles: { id: string; nombre: string; precio: number; tipo: string; modalidad: string; duracion?: number }[];
  saveCliente?: (values: FormValues, options?: { closeDialog?: boolean }) => Promise<any>;
}

export function ClienteForm({ isOpen, onOpenChange, onSubmit, clienteActual, membresiasDisponibles, saveCliente }: ClienteFormProps) {
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<number>(0);
  const steps = [
    { key: 'datos', icon: User2 },
    { key: 'membresia', icon: CalendarRange },
    { key: 'qr', icon: QrCode },
  ];
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        nombre: "",
        email: "",
        telefono: "",
        dni: "",
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
        fecha_fin: "",
        codigo_qr: "",
      },
  });

  // Estados para pago en cuotas
  const [pagoEnCuotas, setPagoEnCuotas] = useState(false);
  const [montoAdelanto, setMontoAdelanto] = useState<number>(0);
  const [numCuotas, setNumCuotas] = useState<number>(1);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");

  // Obtener precio de membresía seleccionada
  const membresiaSeleccionadaId = form.watch("membresia_id");
  const membresiaSeleccionada = membresiasDisponibles.find(m => m.id === membresiaSeleccionadaId);
  const precioMembresia = membresiaSeleccionada?.precio || 0;
  const saldoPendiente = precioMembresia - montoAdelanto;

  // Resetear cuotas cuando cambia la membresía
  useEffect(() => {
    if (membresiaSeleccionada) {
      setMontoAdelanto(0);
      setPagoEnCuotas(false);
    }
  }, [membresiaSeleccionadaId]);

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (membresiaId: string) => {
    const membresiaSeleccionada = membresiasDisponibles.find(m => m.id === membresiaId);
    if (membresiaSeleccionada && membresiaSeleccionada.duracion) {
      const fechaInicio = new Date(form.getValues("fecha_inicio"));
      const fechaVencimiento = addMonths(fechaInicio, membresiaSeleccionada.duracion);
      return format(fechaVencimiento, "yyyy-MM-dd");
    }
    return "";
  };

  // Efecto para actualizar fecha de vencimiento cuando cambia la membresía o fecha de inicio
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "membresia_id" || name === "fecha_inicio") {
        if (value.membresia_id && value.fecha_inicio) {
          const fechaVencimiento = calcularFechaVencimiento(value.membresia_id);
          if (fechaVencimiento) {
            form.setValue("fecha_fin", fechaVencimiento);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, membresiasDisponibles]);

  useEffect(() => {
    if (isOpen) {
      // Reiniciar el paso al primero cada vez que se abre el modal
      setStep(0);
      // Resetear estados de cuotas
      setPagoEnCuotas(false);
      setMontoAdelanto(0);
      setNumCuotas(1);
      setMetodoPago("efectivo");
      
      if (clienteActual) {
        form.reset({
          nombre: clienteActual.nombre,
          email: clienteActual.email,
          telefono: clienteActual.telefono,
          dni: clienteActual.dni || "",
          fecha_nacimiento: clienteActual.fecha_nacimiento || "",
          membresia_id: clienteActual.membresia_id || "",
          fecha_inicio: clienteActual.fecha_inicio ? clienteActual.fecha_inicio.split('T')[0] : "",
          fecha_fin: clienteActual.fecha_fin ? clienteActual.fecha_fin.split('T')[0] : "",
          codigo_qr: (clienteActual as any)?.codigo_qr || "",
        });
      } else {
        form.reset({
          nombre: "",
          email: "",
          telefono: "",
          dni: "",
          fecha_nacimiento: "",
          membresia_id: "",
          fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
          fecha_fin: "",
          codigo_qr: "",
        });
      }
    }
  }, [isOpen, clienteActual, form]);

  const { toast } = useToast();

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      // Si hay saveCliente disponible, usarlo para obtener el cliente creado
      if (saveCliente) {
        // closeDialog: true hace que saveCliente cierre el modal después de guardar
        const clienteCreado = await saveCliente(values, { closeDialog: true });
        
        // Si es un nuevo cliente y tiene membresía, crear el plan de pago
        if (!clienteActual && clienteCreado && membresiaSeleccionada) {
          // Crear registro de pago
          const { data: pagoData, error: pagoError } = await supabase
            .from('pagos')
            .insert({
              cliente_id: clienteCreado.id,
              membresia_id: membresiaSeleccionada.id,
              monto_total: precioMembresia,
              monto_pagado: pagoEnCuotas ? montoAdelanto : precioMembresia,
              nombre_membresia: membresiaSeleccionada.nombre,
              num_cuotas: pagoEnCuotas ? numCuotas : 0,
              estado: pagoEnCuotas && saldoPendiente > 0 ? 'parcial' : 'pagado',
              notas: pagoEnCuotas ? `Adelanto: S/ ${montoAdelanto.toFixed(2)}` : null
            })
            .select()
            .single();

          if (pagoError) {
            console.error('Error al crear pago:', pagoError);
          } else if (pagoData) {
            // Crear transacción inicial (adelanto o pago completo)
            const montoInicial = pagoEnCuotas ? montoAdelanto : precioMembresia;
            if (montoInicial > 0) {
              await supabase
                .from('transacciones')
                .insert({
                  pago_id: pagoData.id,
                  cliente_id: clienteCreado.id,
                  monto: montoInicial,
                  tipo: pagoEnCuotas ? 'adelanto' : 'pago_completo',
                  metodo_pago: metodoPago,
                  notas: pagoEnCuotas ? 'Pago inicial al registrar cliente' : 'Pago completo de membresía'
                });
            }
          }
        }
        // El modal se cierra automáticamente por saveCliente con closeDialog: true
      } else {
        onSubmit(values);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error en submit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el cliente"
      });
    }
  });

  const validateCurrentStep = async () => {
    if (step === 0) {
      return form.trigger(["nombre", "email", "telefono", "dni", "fecha_nacimiento"]);
    }
    if (step === 1) {
      return form.trigger(["membresia_id", "fecha_inicio", "fecha_fin"]);
    }
    return true;
  };

  const goNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const handleGenerarCodigo = () => {
    const telefono = form.getValues("telefono") || "";
    const telPart = telefono.replace(/\D/g, '').slice(-4);
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `FIT-${telPart ? telPart + '-' : ''}${rand}`;
    form.setValue("codigo_qr", code, { shouldDirty: true, shouldTouch: true });
    toast({ title: "Código generado", description: `Se generó el código ${code}.` });
  };

  const handleDownloadQR = () => {
    const code = form.getValues("codigo_qr") || "";
    if (!code) {
      toast({ variant: "destructive", title: "Sin código", description: "Genera o guarda el cliente para descargar el QR." });
      return;
    }
    const nombreCliente = (form.getValues("nombre") || "").trim();
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) {
      toast({ variant: "destructive", title: "QR no disponible", description: "No se encontró el SVG del QR." });
      return;
    }
    // Convertir el SVG del QR a PNG usando un canvas, con marco blanco
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Escalar para mejor resolución
      const baseSize = Number(svg.getAttribute('width')) || svg.clientWidth || 120;
      const scale = 4;
      const width = baseSize * scale;
      const height = baseSize * scale;
      // Marco blanco (10% del tamaño o mínimo 32px)
      const padding = Math.max(32, Math.round(Math.min(width, height) * 0.1));
      // Altura reservada para el encabezado con el nombre
      const headerHeight = nombreCliente ? Math.max(48, Math.round(height * 0.2)) : 0;

      const canvas = document.createElement('canvas');
      canvas.width = width + padding * 2;
      canvas.height = headerHeight + height + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el lienzo para exportar.' });
        return;
      }
      // Fondo blanco para JPG
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Si hay nombre, dibujarlo centrado arriba
      if (headerHeight > 0) {
        let fontSize = Math.round(width * 0.1); // tamaño base proporcional
        const maxTextWidth = canvas.width - padding * 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Reducir fontSize si el texto no cabe
        while (fontSize > 14) {
          ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
          const metrics = ctx.measureText(nombreCliente);
          if (metrics.width <= maxTextWidth) break;
          fontSize -= 2;
        }
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
        // Posicionar texto en el área de encabezado
        const textY = padding; // desde arriba
        ctx.fillText(nombreCliente, Math.floor(canvas.width / 2), textY);
      }
      // Dibujar el QR debajo del encabezado
      const qrY = padding + headerHeight;
      ctx.drawImage(img, padding, qrY, width, height);

      const pngData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `qr-${code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Descarga iniciada', description: `Se descargó el archivo qr-${code}.png` });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast({ variant: 'destructive', title: 'Error al exportar', description: 'No se pudo convertir el QR a imagen PNG.' });
    };
    img.src = url;
  };

  const handlePrintQR = () => {
    const code = form.getValues("codigo_qr") || "";
    if (!code) {
      toast({ variant: "destructive", title: "Sin código", description: "Genera o guarda el cliente para imprimir el QR." });
      return;
    }
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) {
      toast({ variant: "destructive", title: "QR no disponible", description: "No se encontró el SVG del QR." });
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR ${code}</title></head><body style="display:flex;align-items:center;justify-content:center;height:100%;margin:0;">${svgStr}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-primary/90 to-primary px-6 py-5 rounded-t-lg">
          <DialogHeader className="items-center text-center text-white">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
              <User2 className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-bold text-white">
              {clienteActual ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80">
              {clienteActual
                ? "Modifica los datos del cliente"
                : "Completa los datos para registrar un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Indicador de pasos mejorado */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((st, idx) => {
              const Icon = st.icon as any;
              const active = idx === step;
              const done = idx < step;
              const labels = ['Datos', 'Membresía', 'QR'];
              return (
                <div key={st.key} className="flex items-center gap-2 md:gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`
                      h-10 w-10 md:h-12 md:w-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                      ${active 
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                        : done 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                      }
                    `}>
                      {done ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${active ? 'text-primary' : done ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {labels[idx]}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`hidden md:block w-12 lg:w-20 h-0.5 rounded transition-colors duration-300 ${done ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="px-6 py-5">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paso 0: Datos personales */}
            {step === 0 && (
              <div className="space-y-3 md:space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@ejemplo.com" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="912345678" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">DNI (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_nacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Fecha de nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 1: Membresía y fechas */}
            {step === 1 && (
              <div className="space-y-3 md:space-y-4">
                <FormField
                  control={form.control}
                  name="membresia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Membresía</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecciona una membresía" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membresiasDisponibles.map((membresia) => (
                            <SelectItem key={membresia.id} value={membresia.id}>
                              <div className="flex flex-col">
                                <div className="font-medium text-sm">{membresia.nombre}</div>
                                <div className="text-xs text-muted-foreground">
                                  {membresia.tipo.charAt(0).toUpperCase() + membresia.tipo.slice(1)} • {membresia.modalidad.charAt(0).toUpperCase() + membresia.modalidad.slice(1)} • S/ {membresia.precio}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Fecha de inicio</FormLabel>
                      <FormControl>
                        <Input type="date" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Fecha de vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sección de Pago en Cuotas - Solo para nuevo cliente */}
                {!clienteActual && membresiaSeleccionada && (
                  <div className="border rounded-lg p-4 mt-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <Label htmlFor="pago-cuotas" className="font-medium">Pago en cuotas</Label>
                      </div>
                      <Switch
                        id="pago-cuotas"
                        checked={pagoEnCuotas}
                        onCheckedChange={setPagoEnCuotas}
                      />
                    </div>

                    {!pagoEnCuotas && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Precio de membresía:</span>
                          <span className="font-medium text-foreground">S/ {precioMembresia.toFixed(2)}</span>
                        </div>
                        <p className="mt-2 text-xs">El cliente pagará el monto completo al registrarse.</p>
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
                          <Label htmlFor="adelanto" className="text-sm">Monto de adelanto (S/)</Label>
                          <Input
                            id="adelanto"
                            type="number"
                            step="0.01"
                            min="0"
                            max={precioMembresia}
                            value={montoAdelanto}
                            onChange={(e) => setMontoAdelanto(Math.min(parseFloat(e.target.value) || 0, precioMembresia))}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor="num-cuotas" className="text-sm">Número de cuotas (máx. 2)</Label>
                          <Select value={String(numCuotas)} onValueChange={(v) => setNumCuotas(Number(v))}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 cuota</SelectItem>
                              <SelectItem value="2">2 cuotas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="metodo-pago" className="text-sm">Método de pago (adelanto)</Label>
                          <Select value={metodoPago} onValueChange={setMetodoPago}>
                            <SelectTrigger className="text-sm">
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

                        {saldoPendiente > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Plan de cuotas:</p>
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
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: Código QR */}
            {step === 2 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <FormField
                    control={form.control}
                    name="codigo_qr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Código QR</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="FIT-XXXXXX" className="text-sm" {...field} />
                            <Button type="button" variant="secondary" onClick={handleGenerarCodigo}>Generar</Button>
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Presiona "Generar" para crear un código QR. Este campo es opcional.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div ref={qrContainerRef} className="flex items-center justify-center p-2 border rounded-md bg-muted/30">
                    {form.watch("codigo_qr") ? (
                      <QRCode value={form.watch("codigo_qr") || ""} size={120} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Se visualizará el código tras generar o guardar el cliente</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDownloadQR} className="text-sm">Descargar QR</Button>
                  <Button type="button" variant="outline" onClick={handlePrintQR} className="text-sm">Imprimir QR</Button>
                </div>
              </div>
            )}

            {/* Navegación */}
            <DialogFooter className="flex-col gap-3 pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between w-full">
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="text-sm">
                      Cancelar
                    </Button>
                  </DialogClose>
                </div>
                <div className="flex gap-2">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={goPrev} className="text-sm">Atrás</Button>
                  )}
                  {step < steps.length - 1 ? (
                    <Button type="button" onClick={goNext} className="text-sm">Siguiente</Button>
                  ) : (
                    <Button type="submit" className="text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" disabled={form.formState.isSubmitting}>
                      {clienteActual ? "Actualizar" : "Guardar Cliente"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
