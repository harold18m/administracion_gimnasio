
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useMembresias } from "@/hooks/useMembresias";
import type { Database } from "@/lib/supabase";

type Cliente = Database['public']['Tables']['clientes']['Row'];
type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];
type ClienteUpdate = Database['public']['Tables']['clientes']['Update'];

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getMembresiasPorSeleccion } = useMembresias();

  // Cargar clientes desde Supabase
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClientes(data || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.telefono.includes(busqueda)
  );

  const handleEdit = (cliente: Cliente) => {
    setClienteActual(cliente);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClientes(clientes.filter((cliente) => cliente.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: any) => {
    try {
      if (clienteActual) {
        // Editar cliente existente
        const updateData: ClienteUpdate = {
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
          fecha_nacimiento: values.fecha_nacimiento,
          membresia_id: values.membresia_id || null,
          fecha_inicio: values.fecha_inicio || null,
          fecha_fin: values.fecha_fin || null,
        };

        const { data, error } = await supabase
          .from('clientes')
          .update(updateData)
          .eq('id', clienteActual.id)
          .select()
          .single();

        if (error) throw error;

        setClientes(
          clientes.map((c) => (c.id === clienteActual.id ? data : c))
        );

        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente han sido actualizados correctamente",
        });
      } else {
        // Agregar nuevo cliente
        const insertData: ClienteInsert = {
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
          fecha_nacimiento: values.fecha_nacimiento,
          membresia_id: values.membresia_id || null,
          fecha_inicio: values.fecha_inicio || null,
          fecha_fin: values.fecha_fin || null,
          estado: 'activa',
          asistencias: 0,
        };

        const { data, error } = await supabase
          .from('clientes')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;

        setClientes([data, ...clientes]);
        toast({
          title: "Cliente agregado",
          description: "El nuevo cliente ha sido agregado correctamente",
        });
      }

      setIsDialogOpen(false);
      setClienteActual(null);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      });
    }
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
    loading,
    handleEdit,
    handleDelete,
    onSubmit,
    handleAddNew,
    membresiasDisponibles: getMembresiasPorSeleccion(),
    fetchClientes,
  };
};
