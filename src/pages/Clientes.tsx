
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Search, UserPlus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  membresia: "activa" | "vencida" | "pendiente";
  fechaInicio: string;
  fechaFin: string;
  asistencias: number;
  avatarUrl?: string;
}

const clientesIniciales: Cliente[] = [
  {
    id: "1",
    nombre: "Carlos Mendoza",
    dni: "45678912",
    email: "carlos@example.com",
    telefono: "912345678",
    membresia: "activa",
    fechaInicio: "2023-10-01",
    fechaFin: "2023-11-01",
    asistencias: 15,
  },
  {
    id: "2",
    nombre: "María López",
    dni: "87654321",
    email: "maria@example.com",
    telefono: "987654321",
    membresia: "activa",
    fechaInicio: "2023-09-15",
    fechaFin: "2023-10-15",
    asistencias: 20,
  },
  {
    id: "3",
    nombre: "Juan Pérez",
    dni: "12345678",
    email: "juan@example.com",
    telefono: "912345678",
    membresia: "pendiente",
    fechaInicio: "2023-10-05",
    fechaFin: "2023-11-05",
    asistencias: 5,
  },
  {
    id: "4",
    nombre: "Ana García",
    dni: "98765432",
    email: "ana@example.com",
    telefono: "998765432",
    membresia: "vencida",
    fechaInicio: "2023-08-01",
    fechaFin: "2023-09-01",
    asistencias: 30,
  },
  {
    id: "5",
    nombre: "Roberto Sánchez",
    dni: "56789123",
    email: "roberto@example.com",
    telefono: "956789123",
    membresia: "activa",
    fechaInicio: "2023-09-20",
    fechaFin: "2023-10-20",
    asistencias: 12,
  },
];

const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  dni: z.string().min(8, { message: "El DNI debe tener al menos 8 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  telefono: z.string().min(9, { message: "El teléfono debe tener al menos 9 caracteres" }),
  fechaInicio: z.string().min(1, { message: "La fecha de inicio es requerida" }),
  fechaFin: z.string().min(1, { message: "La fecha de fin es requerida" }),
});

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      dni: "",
      email: "",
      telefono: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.dni.includes(busqueda) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleEdit = (cliente: Cliente) => {
    setClienteActual(cliente);
    form.reset({
      nombre: cliente.nombre,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      fechaInicio: cliente.fechaInicio,
      fechaFin: cliente.fechaFin,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((cliente) => cliente.id !== id));
    toast({
      title: "Cliente eliminado",
      description: "El cliente ha sido eliminado correctamente",
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (clienteActual) {
      // Editar cliente existente
      setClientes(
        clientes.map((c) =>
          c.id === clienteActual.id
            ? {
                ...c,
                ...values,
              }
            : c
        )
      );
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados correctamente",
      });
    } else {
      // Agregar nuevo cliente
      const nuevoCliente: Cliente = {
        id: Math.random().toString(36).substr(2, 9),
        nombre: values.nombre,
        dni: values.dni,
        email: values.email,
        telefono: values.telefono,
        fechaInicio: values.fechaInicio,
        fechaFin: values.fechaFin,
        membresia: "activa",
        asistencias: 0,
      };
      setClientes([...clientes, nuevoCliente]);
      toast({
        title: "Cliente agregado",
        description: "El nuevo cliente ha sido agregado correctamente",
      });
    }
    setIsDialogOpen(false);
    setClienteActual(null);
    form.reset();
  };

  const handleAddNew = () => {
    setClienteActual(null);
    form.reset({
      nombre: "",
      dni: "",
      email: "",
      telefono: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Clientes</h2>
        <Button onClick={handleAddNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>
            Administra los datos de los clientes del gimnasio
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o email..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Asistencias</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={cliente.avatarUrl} />
                          <AvatarFallback>
                            {cliente.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cliente.nombre}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.dni}</TableCell>
                    <TableCell>
                      <div>
                        <p>{cliente.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.telefono}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoStyle[cliente.membresia]}>
                        {cliente.membresia}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          Inicio: {new Date(cliente.fechaInicio).toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          Fin: {new Date(cliente.fechaFin).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.asistencias}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaInicio"
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
                  name="fechaFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
    </div>
  );
}
