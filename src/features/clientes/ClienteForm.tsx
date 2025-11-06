
import { useEffect, useRef } from "react";
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
import { format, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

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
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
        fecha_fin: "",
        codigo_qr: "",
      });
    }
  }, [clienteActual, form]);

  const { toast } = useToast();

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });
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
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) {
      toast({ variant: "destructive", title: "QR no disponible", description: "No se encontró el SVG del QR." });
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${code}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Descarga iniciada", description: `Se descargó el archivo qr-${code}.svg` });
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
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {clienteActual ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {clienteActual
              ? "Modifica los datos del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna 1: Datos personales */}
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

              {/* Columna 2: Membresía y fechas */}
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
              </div>
            </div>
            <DialogFooter className="flex-col gap-3">
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
                      <p className="text-xs text-muted-foreground mt-1">Si generas uno aquí se respetará; si lo dejas vacío, se autogenerará al guardar usando los últimos 4 dígitos de tu teléfono e ID.</p>
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
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDownloadQR} className="text-sm">Descargar QR</Button>
                  <Button type="button" variant="outline" onClick={handlePrintQR} className="text-sm">Imprimir QR</Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-end w-full">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto text-sm" disabled={form.formState.isSubmitting}>
                  {clienteActual ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
