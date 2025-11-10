import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Rutina = Database['public']['Tables']['rutinas']['Row'];
type RutinaInsert = Database['public']['Tables']['rutinas']['Insert'];
type RutinaUpdate = Database['public']['Tables']['rutinas']['Update'];
type RutinaEjercicio = Database['public']['Tables']['rutina_ejercicios']['Row'];
type RutinaEjercicioInsert = Database['public']['Tables']['rutina_ejercicios']['Insert'];

export const useRutinas = () => {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchRutinas = async (clienteId?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('rutinas').select('*').order('created_at', { ascending: false });
      if (clienteId) query = query.eq('cliente_id', clienteId);
      const { data, error } = await query;
      if (error) throw error;
      setRutinas(data || []);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las rutinas" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRutinas(); }, []);

  const createRutina = async (
    base: Omit<RutinaInsert, 'id'>,
    ejercicios: Array<Omit<RutinaEjercicioInsert, 'id' | 'rutina_id'>>
  ) => {
    try {
      const { data: inserted, error } = await supabase
        .from('rutinas')
        .insert([base])
        .select()
        .single();
      if (error) throw error;
      if (ejercicios.length > 0) {
        const withOrder = ejercicios.map((e, idx) => ({ ...e, rutina_id: inserted.id, orden: e.orden ?? (idx + 1) }));
        const { error: detErr } = await supabase.from('rutina_ejercicios').insert(withOrder);
        if (detErr) throw detErr;
      }
      setRutinas([inserted, ...rutinas]);
      return inserted;
    } catch (err) {
      console.error('Error al crear rutina:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la rutina" });
      throw err;
    }
  };

  const updateRutina = async (id: string, changes: RutinaUpdate) => {
    try {
      const { data, error } = await supabase
        .from('rutinas')
        .update(changes)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setRutinas(prev => prev.map(r => (r.id === id ? (data as Rutina) : r)));
      return data as Rutina;
    } catch (err) {
      console.error('Error al actualizar rutina:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la rutina" });
      throw err;
    }
  };

  const getRutinaDetalle = async (rutinaId: string) => {
    const { data: rutina, error: rErr } = await supabase.from('rutinas').select('*').eq('id', rutinaId).single();
    if (rErr) throw rErr;
    const { data: detalle, error: dErr } = await supabase
      .from('rutina_ejercicios')
      .select('*, ejercicios(*)')
      .eq('rutina_id', rutinaId)
      .order('dia', { ascending: true })
      .order('orden', { ascending: true });
    if (dErr) throw dErr;
    return { rutina, detalle } as const;
  };

  const deleteRutina = async (id: string) => {
    try {
      const { error } = await supabase.from('rutinas').delete().eq('id', id);
      if (error) throw error;
      setRutinas(rutinas.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error al eliminar rutina:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la rutina" });
      throw err;
    }
  };

  return {
    rutinas,
    loading,
    fetchRutinas,
    createRutina,
    getRutinaDetalle,
    updateRutina,
    deleteRutina,
  };
};