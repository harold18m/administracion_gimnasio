
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";

export const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
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
      });
    }
  }, [clienteActual, form]);

  const { toast } = useToast();
  const [agentStatus, setAgentStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>("idle");
  const [enrollState, setEnrollState] = useState<'idle' | 'connecting' | 'enrolling' | 'success' | 'error'>("idle");
  const [enrollMessage, setEnrollMessage] = useState<string>("");
  const [enrollDate, setEnrollDate] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const AGENT_URL = (import.meta as any).env?.VITE_AGENT_URL || "http://localhost:5599";
  const VERCEL_API_BASE = (import.meta as any).env?.VITE_VERCEL_API_BASE || "";

  useEffect(() => {
    if (isOpen) {
      checkAgentHealth();
    }
  }, [isOpen]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  const checkAgentHealth = async () => {
    try {
      setAgentStatus("checking");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${AGENT_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Agente no disponible");
      setAgentStatus("online");
      return true;
    } catch (e) {
      setAgentStatus("offline");
      toast({ title: "Agente offline", description: "No se pudo conectar con el agente local. Asegúrate de que esté ejecutándose.", variant: "destructive" });
      return false;
    }
  };

  const enrollFingerprint = async (clientId: string) => {
    try {
      setIsEnrolling(true);
      setEnrollState("connecting");
      setEnrollMessage("Conectando con el agente...");
      const ok = await checkAgentHealth();
      if (!ok) {
        setEnrollState("error");
        setEnrollMessage("El agente no está disponible. Verifica que esté ejecutándose.");
        toast({ title: "Agente no disponible", description: "No se pudo conectar con el agente local.", variant: "destructive" });
        setIsEnrolling(false);
        return;
      }

      setEnrollState("enrolling");
      setEnrollMessage("Capturando y subiendo la huella...");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 190000);
      const res = await fetch(`${AGENT_URL}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, finger_label: "right_index" }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al enrolar huella");
      }

      // Parsear resultado del helper
      const agentPayload = await res.json();
      const helperJson = agentPayload?.json;
      if (!helperJson) {
        throw new Error("No se recibió JSON del helper.");
      }
      if (helperJson.ok === false) {
        throw new Error(helperJson.error || "La captura de la huella falló.");
      }

      // Si el agente ya guardó en Supabase, evitar inserción duplicada desde el backend
      if (agentPayload?.supabase_id) {
        setEnrollState("success");
        const now = new Date();
        setEnrollDate(format(now, "yyyy-MM-dd HH:mm"));
        setEnrollMessage("Huella enrolada y guardada correctamente (guardada por el agente).");
        toast({ title: "Huella enrolada", description: "La huella ha sido enrolada exitosamente." });
        return;
      }

      // Enviar al backend de Vercel para guardar en Supabase
      setEnrollMessage("Subiendo plantilla al backend...");
      const base = VERCEL_API_BASE || window.location.origin;
      const saveRes = await fetch(`${base}/api/fingerprint/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clientId, finger_label: helperJson?.finger_label || "right_index", json: helperJson }),
      });
      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(errText || "No se pudo guardar la huella en el backend.");
      }
      const saveJson = await saveRes.json();
      if (!saveJson?.ok) {
        throw new Error(saveJson?.error || "No se pudo guardar la huella.");
      }

      setEnrollState("success");
      const now = new Date();
      setEnrollDate(format(now, "yyyy-MM-dd HH:mm"));
      setEnrollMessage("Huella enrolada y guardada correctamente.");
      toast({ title: "Huella enrolada", description: "La huella ha sido enrolada exitosamente." });
    } catch (err: any) {
      console.error(err);
      setEnrollState("error");
      setEnrollMessage(err?.message || "No se pudo enrolar la huella.");
      toast({ title: "Error", description: "No se pudo enrolar la huella.", variant: "destructive" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleGuardarYEnrolar = form.handleSubmit(async (values) => {
    try {
      if (!saveCliente) {
        toast({ title: "Acción no disponible", description: "No se puede guardar el cliente desde este formulario.", variant: "destructive" });
        return;
      }
      const clienteGuardado = await saveCliente(values, { closeDialog: false });
      if (!clienteGuardado?.id) {
        toast({ title: "Error", description: "No se obtuvo el ID del cliente.", variant: "destructive" });
        return;
      }
      await enrollFingerprint(clienteGuardado.id);
    } catch (e) {
      // manejo de errores ya gestionado
    }
  });

  const handleActualizarHuella = async () => {
    if (!clienteActual?.id) {
      toast({ title: "Cliente requerido", description: "Guarda el cliente antes de enrolar la huella.", variant: "destructive" });
      return;
    }
    await enrollFingerprint(clienteActual.id);
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
            <DialogFooter className="flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={agentStatus === 'online' ? 'default' : agentStatus === 'offline' ? 'destructive' : 'secondary'}>
                  {agentStatus === 'online' ? 'Agente conectado' : agentStatus === 'offline' ? 'Agente desconectado' : agentStatus === 'checking' ? 'Verificando agente...' : 'Agente'}
                </Badge>
                <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={checkAgentHealth} disabled={agentStatus === 'checking'}>
                  {agentStatus === 'checking' ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<RefreshCw className="h-4 w-4" />)}
                  <span className="sr-only">Verificar agente</span>
                </Button>
                {enrollDate && (
                  <Badge variant="outline">Huella enrolada: {enrollDate}</Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto text-sm" disabled={form.formState.isSubmitting}>
                  {clienteActual ? "Actualizar" : "Guardar"}
                </Button>
                <Button type="button" className="w-full sm:w-auto text-sm" onClick={handleGuardarYEnrolar} disabled={isEnrolling || form.formState.isSubmitting || agentStatus !== 'online'}>
                  {isEnrolling ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolando...</>) : 'Guardar y Enrolar'}
                </Button>
                <Button type="button" variant="secondary" className="w-full sm:w-auto text-sm" onClick={handleActualizarHuella} disabled={!clienteActual?.id || isEnrolling || agentStatus !== 'online'}>
                  {isEnrolling ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolando...</>) : 'Actualizar huella'}
                </Button>
              </div>
              {enrollState !== 'idle' && (
                <div className={`text-sm ${enrollState === 'error' ? 'text-red-600' : enrollState === 'success' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {enrollMessage}
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
