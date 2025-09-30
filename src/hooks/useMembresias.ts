import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/supabase';

type Membresia = Database['public']['Tables']['membresias']['Row'];
type MembresiaInsert = Database['public']['Tables']['membresias']['Insert'];
type MembresiaUpdate = Database['public']['Tables']['membresias']['Update'];

export const useMembresias = () => {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar membresías desde Supabase
  const fetchMembresias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membresias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembresias(data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar membresías:', err);
      setError('Error al cargar las membresías');
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva membresía
  const crearMembresia = async (membresia: MembresiaInsert) => {
    try {
      const { data, error } = await supabase
        .from('membresias')
        .insert([membresia])
        .select()
        .single();

      if (error) throw error;

      setMembresias(prev => [data, ...prev]);
      toast({
        title: "Membresía creada",
        description: "La membresía ha sido creada exitosamente",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al crear membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo crear la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Actualizar membresía
  const actualizarMembresia = async (id: string, updates: MembresiaUpdate) => {
    try {
      const { data, error } = await supabase
        .from('membresias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMembresias(prev => 
        prev.map(m => m.id === id ? data : m)
      );

      toast({
        title: "Membresía actualizada",
        description: "La membresía ha sido actualizada exitosamente",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al actualizar membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Eliminar membresía
  const eliminarMembresia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('membresias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMembresias(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Membresía eliminada",
        description: "La membresía ha sido eliminada exitosamente",
      });

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Obtener membresías activas para selección
  const getMembresiasPorTipo = () => {
    const tiposMembresia = [
      { value: 'mensual', label: 'Mensual' },
      { value: 'trimestral', label: 'Trimestral' }
    ];

    return tiposMembresia.map(tipo => ({
      ...tipo,
      membresias: membresias.filter(m => m.tipo === tipo.value && m.activa),
      total: membresias.filter(m => m.tipo === tipo.value && m.activa).length
    }));
  };

  // Obtener membresías disponibles para formularios
  const getMembresiasPorSeleccion = () => {
    return membresias
      .filter(m => m.activa)
      .map(m => ({
        id: m.id,
        nombre: m.nombre,
        precio: m.precio,
        tipo: m.tipo,
        modalidad: m.modalidad,
        duracion: m.duracion
      }));
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchMembresias();
  }, []);

  return {
    membresias,
    loading,
    error,
    fetchMembresias,
    crearMembresia,
    actualizarMembresia,
    eliminarMembresia,
    getMembresiasPorTipo,
    getMembresiasPorSeleccion,
  };
};