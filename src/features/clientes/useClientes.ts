
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
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
      (cliente.email?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      cliente.telefono.includes(busqueda) ||
      (cliente.dni?.includes(busqueda) ?? false)
  );

  const handleEdit = (cliente: Cliente) => {
    setClienteActual(cliente);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClienteToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteToDelete);

      if (error) throw error;

      setClientes(clientes.filter((cliente) => cliente.id !== clienteToDelete));
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
    } finally {
      setClienteToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const saveCliente = async (values: any, options: { closeDialog?: boolean } = { closeDialog: false }) => {
    const computeCodigoQR = (telefono: string | null | undefined, id: string): string => {
      const telPart = (telefono || '').replace(/\D/g, '').slice(-4);
      const idPart = (id || '').split('-')[0].toUpperCase();
      return `FIT-${telPart ? telPart + '-' : ''}${idPart}`;
    };

    // Obtener nombre y modalidad de la membresía seleccionada
    const membresiaSeleccionada = values.membresia_id 
      ? getMembresiasPorSeleccion().find(m => m.id === values.membresia_id)
      : null;

    try {
      // Validar duplicidad de Código QR antes de proceder
      const qrToCheck = values.codigo_qr ? values.codigo_qr.trim().toUpperCase() : null;
      if (qrToCheck) {
        let query = supabase.from('clientes').select('id, nombre').eq('codigo_qr', qrToCheck);
        
        // Si estamos editando, excluir al cliente actual
        if (clienteActual) {
          query = query.neq('id', clienteActual.id);
        }
        
        const { data: duplicates, error: dupError } = await query;
        
        if (dupError) {
          throw dupError;
        }

        if (duplicates && duplicates.length > 0) {
          toast({
            variant: "destructive",
            title: "Código QR no disponible",
            description: `El código ${qrToCheck} ya está asignado a ${duplicates[0].nombre}.`
          });
          throw new Error("Código QR duplicado");
        }
      }

      if (clienteActual) {
        // Editar cliente existente
        const updateData: ClienteUpdate = {
          nombre: values.nombre,
          email: values.email && values.email.trim().length > 0 ? values.email : null,
          telefono: values.telefono,
          dni: values.dni || null,
          fecha_nacimiento: values.fecha_nacimiento,
          membresia_id: values.membresia_id || null,
          nombre_membresia: membresiaSeleccionada?.nombre || null,
          tipo_membresia: membresiaSeleccionada?.modalidad || null,
          fecha_inicio: values.fecha_inicio || null,
          fecha_fin: values.fecha_fin || null,
          condicion_medica: values.condicion_medica || null,
          codigo_qr: ((values.codigo_qr && values.codigo_qr.trim().length > 0)
            ? values.codigo_qr
            : computeCodigoQR(values.telefono || null, clienteActual.id))?.toUpperCase(),
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

        if (options.closeDialog) {
          setIsEditDialogOpen(false);
          setClienteActual(null);
        } else {
          setClienteActual(data);
        }

        return data;
      } else {
        // Agregar nuevo cliente
        const insertData: ClienteInsert = {
          nombre: values.nombre,
          email: values.email && values.email.trim().length > 0 ? values.email : null,
          telefono: values.telefono,
          dni: values.dni || null,
          fecha_nacimiento: values.fecha_nacimiento,
          membresia_id: values.membresia_id || null,
          nombre_membresia: membresiaSeleccionada?.nombre || null,
          tipo_membresia: membresiaSeleccionada?.modalidad || null,
          fecha_inicio: values.fecha_inicio || null,
          fecha_fin: values.fecha_fin || null,
          condicion_medica: values.condicion_medica || null,
          estado: 'activa',
          asistencias: 0,
        };

        const { data, error } = await supabase
          .from('clientes')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        
        let updated = data;
        // Solo actualizar código QR si el usuario generó uno manualmente
        // NOTA: La validación de duplicados ya se hizo arriba
        if (values.codigo_qr && values.codigo_qr.trim().length > 0) {
          const codigoFinal = values.codigo_qr.trim().toUpperCase();
          const { data: updatedData, error: errorCode } = await supabase
            .from('clientes')
            .update({ codigo_qr: codigoFinal })
            .eq('id', data.id)
            .select()
            .single();

          if (errorCode) throw errorCode;
          updated = updatedData;
        }

        setClientes([updated, ...clientes]);
        toast({
          title: "Cliente agregado",
          description: values.codigo_qr ? `Cliente registrado con código ${values.codigo_qr.toUpperCase()}.` : "Cliente registrado correctamente.",
        });

        if (options.closeDialog) {
          setIsDialogOpen(false);
          setClienteActual(null);
        } else {
          setClienteActual(updated);
        }

        return updated;
      }
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      // Si el error no fue manejado (como el de duplicado), mostrar genérico
      if (err instanceof Error && err.message !== "Código QR duplicado") {
         toast({
          title: "Error",
          description: "No se pudo guardar el cliente",
          variant: "destructive",
        });
      }
      throw err;
    }
  };

  const onSubmit = async (values: any) => {
    await saveCliente(values, { closeDialog: false });
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
    isEditDialogOpen,
    setIsEditDialogOpen,
    clienteActual,
    loading,
    handleEdit,
    handleDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    onSubmit,
    handleAddNew,
    membresiasDisponibles: getMembresiasPorSeleccion(),
    fetchClientes,
    saveCliente,
  };
};
