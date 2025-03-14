
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Cliente, clientesIniciales } from "./types";

export const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  dni: z.string().min(8, { message: "El DNI debe tener al menos 8 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  telefono: z.string().min(9, { message: "El teléfono debe tener al menos 9 caracteres" }),
  fechaInicio: z.string().min(1, { message: "La fecha de inicio es requerida" }),
  fechaFin: z.string().min(1, { message: "La fecha de fin es requerida" }),
});

export type FormValues = z.infer<typeof formSchema>;

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.dni.includes(busqueda) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleEdit = (cliente: Cliente) => {
    setClienteActual(cliente);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((cliente) => cliente.id !== id));
    toast({
      title: "Cliente eliminado",
      description: "El cliente ha sido eliminado correctamente",
    });
  };

  const onSubmit = (values: FormValues) => {
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
  };

  const handleAddNew = () => {
    setClienteActual(null);
    setIsDialogOpen(true);
  };

  return {
    clientes,
    filteredClientes,
    busqueda,
    setBusqueda,
    isDialogOpen,
    setIsDialogOpen,
    clienteActual,
    handleEdit,
    handleDelete,
    onSubmit,
    handleAddNew,
  };
};
