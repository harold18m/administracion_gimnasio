
import { useEffect } from "react";
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

export const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  telefono: z.string().min(9, { message: "El teléfono debe tener al menos 9 caracteres" }),
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
  membresiasDisponibles: { id: string; nombre: string; precio: number; tipo: string; modalidad: string }[];
}

export function ClienteForm({ isOpen, onOpenChange, onSubmit, clienteActual, membresiasDisponibles }: ClienteFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        nombre: "",
        email: "",
        telefono: "",
        fecha_nacimiento: "",
        membresia_id: "",
        fecha_inicio: "",
        fecha_fin: "",
      },
  });

  useEffect(() => {
    if (clienteActual) {
      form.reset({
        nombre: clienteActual.nombre,
        email: clienteActual.email,
        telefono: clienteActual.telefono,
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
        fecha_inicio: "",
        fecha_fin: "",
      });
    }
  }, [clienteActual, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {clienteActual ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {clienteActual
              ? "Modifica los datos del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                            <div className="text-sm text-muted-foreground">
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
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio de membresía</FormLabel>
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
                  <FormLabel>Fecha de vencimiento de membresía</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {clienteActual ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
