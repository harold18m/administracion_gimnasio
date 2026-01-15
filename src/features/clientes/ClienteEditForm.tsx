
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Database } from "@/lib/supabase";
import { format, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { User2, Star, QrCode, Download, Printer } from "lucide-react";

type ClienteRow = Database['public']['Tables']['clientes']['Row'];

export const editFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
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

export type EditFormValues = z.infer<typeof editFormSchema>;

interface ClienteEditFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditFormValues) => void;
  cliente: ClienteRow;
  membresiasDisponibles: { id: string; nombre: string; precio: number; tipo: string; modalidad: string; duracion?: number }[];
}

export function ClienteEditForm({ isOpen, onOpenChange, onSubmit, cliente, membresiasDisponibles }: ClienteEditFormProps) {
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState("datos");
  const { toast } = useToast();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      dni: "",
      fecha_nacimiento: "",
      membresia_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      codigo_qr: "",
    },
  });

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (membresiaId: string) => {
    const membresiaSeleccionada = membresiasDisponibles.find(m => m.id === membresiaId);
    if (membresiaSeleccionada && membresiaSeleccionada.duracion) {
      const fechaInicio = new Date(form.getValues("fecha_inicio") || new Date());
      const fechaVencimiento = addMonths(fechaInicio, membresiaSeleccionada.duracion);
      return format(fechaVencimiento, "yyyy-MM-dd");
    }
    return "";
  };

  // Efecto para actualizar fecha de vencimiento cuando cambia la membresía
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

  // Cargar datos del cliente cuando se abre
  useEffect(() => {
    if (cliente && isOpen) {
      form.reset({
        nombre: cliente.nombre,
        email: cliente.email || "",
        telefono: cliente.telefono,
        dni: cliente.dni || "",
        fecha_nacimiento: cliente.fecha_nacimiento || "",
        membresia_id: cliente.membresia_id || "",
        fecha_inicio: cliente.fecha_inicio ? cliente.fecha_inicio.split('T')[0] : "",
        fecha_fin: cliente.fecha_fin ? cliente.fecha_fin.split('T')[0] : "",
        codigo_qr: (cliente as any)?.codigo_qr || "",
      });
      setActiveTab("datos");
    }
  }, [cliente, isOpen, form]);

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
      toast({ variant: "destructive", title: "Sin código", description: "Genera un código QR primero." });
      return;
    }
    const nombreCliente = (form.getValues("nombre") || "").trim();
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) {
      toast({ variant: "destructive", title: "QR no disponible", description: "No se encontró el SVG del QR." });
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const baseSize = Number(svg.getAttribute('width')) || svg.clientWidth || 120;
      const scale = 4;
      const width = baseSize * scale;
      const height = baseSize * scale;
      const padding = Math.max(32, Math.round(Math.min(width, height) * 0.1));
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
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (headerHeight > 0) {
        let fontSize = Math.round(width * 0.1);
        const maxTextWidth = canvas.width - padding * 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        while (fontSize > 14) {
          ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
          const metrics = ctx.measureText(nombreCliente);
          if (metrics.width <= maxTextWidth) break;
          fontSize -= 2;
        }
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
        const textY = padding;
        ctx.fillText(nombreCliente, Math.floor(canvas.width / 2), textY);
      }
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



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <User2 className="h-5 w-5" />
            Editar Cliente
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de <span className="font-semibold text-foreground">{cliente.nombre}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="datos" className="flex items-center gap-2">
                  <User2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Datos</span>
                </TabsTrigger>
                <TabsTrigger value="membresia" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Membresía</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">QR</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Datos Personales */}
              <TabsContent value="datos" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
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
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@ejemplo.com" {...field} />
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
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="912345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="fecha_nacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab Membresía */}
              <TabsContent value="membresia" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="membresia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membresía</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una membresía" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membresiasDisponibles.map((membresia) => (
                            <SelectItem key={membresia.id} value={membresia.id}>
                              <div className="flex flex-col">
                                <div className="font-medium">{membresia.nombre}</div>
                                <div className="text-xs text-muted-foreground">
                                  {membresia.tipo} • {membresia.modalidad} • S/ {membresia.precio}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Fecha de vencimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab QR */}
              <TabsContent value="qr" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="codigo_qr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código QR</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input placeholder="FIT-XXXXXX" {...field} />
                              <Button type="button" variant="secondary" onClick={handleGenerarCodigo}>
                                Generar
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                  <div ref={qrContainerRef} className="flex items-center justify-center p-4 border rounded-lg bg-white min-h-[150px]">
                    {form.watch("codigo_qr") ? (
                      <QRCode value={form.watch("codigo_qr") || ""} size={120} />
                    ) : (
                      <span className="text-sm text-muted-foreground text-center">
                        Genera un código para ver el QR
                      </span>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
