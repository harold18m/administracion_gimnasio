import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Ejercicio = Database['public']['Tables']['ejercicios']['Row'];
type EjercicioInsert = Database['public']['Tables']['ejercicios']['Insert'];
type EjercicioUpdate = Database['public']['Tables']['ejercicios']['Update'];

export const useEjercicios = () => {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>("");
  const { toast } = useToast();

  const fetchEjercicios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEjercicios(data || []);
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los ejercicios" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEjercicios(); }, []);

  const filteredEjercicios = ejercicios.filter((e) => {
    const q = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      (e.categoria?.toLowerCase().includes(q) ?? false) ||
      (e.musculos || []).some(m => m.toLowerCase().includes(q))
    );
  });

  const uploadImagen = async (file: File, ejercicioId: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${ejercicioId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('ejercicios').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('ejercicios').getPublicUrl(path);
      return data.publicUrl || null;
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo subir la imagen" });
      return null;
    }
  };

  const createEjercicio = async (values: Omit<EjercicioInsert, 'id'> & { imagenFile?: File | null }) => {
    try {
      const baseInsert: EjercicioInsert = {
        nombre: values.nombre,
        categoria: values.categoria || null,
        dificultad: values.dificultad || null,
        musculos: values.musculos || [],
        descripcion: values.descripcion || null,
        imagen_url: values.imagen_url ?? null,
        video_url: values.video_url || null,
      };
      const { data: inserted, error } = await supabase
        .from('ejercicios')
        .insert([baseInsert])
        .select()
        .single();
      if (error) throw error;
      // Si se proporcionó URL, no intentamos subir archivo. Si no hay URL y hay archivo, subimos.
      let imagenUrl: string | null = baseInsert.imagen_url ?? null;
      if (!imagenUrl && values.imagenFile) {
        imagenUrl = await uploadImagen(values.imagenFile, inserted.id);
        if (imagenUrl) {
          const { data: updated, error: upErr } = await supabase
            .from('ejercicios')
            .update({ imagen_url: imagenUrl })
            .eq('id', inserted.id)
            .select()
            .single();
          if (upErr) throw upErr;
          setEjercicios([updated, ...ejercicios]);
          return updated;
        }
      }
      setEjercicios([inserted, ...ejercicios]);
      return inserted;
    } catch (err) {
      console.error('Error al crear ejercicio:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el ejercicio" });
      throw err;
    }
  };

  const updateEjercicio = async (id: string, values: Partial<EjercicioUpdate> & { imagenFile?: File | null }) => {
    try {
      let imagenUrl: string | undefined;
      if (values.imagenFile) {
        const url = await uploadImagen(values.imagenFile, id);
        if (url) imagenUrl = url;
      }
      const { data, error } = await supabase
        .from('ejercicios')
        .update({
          nombre: values.nombre,
          categoria: values.categoria,
          dificultad: values.dificultad,
          musculos: values.musculos,
          descripcion: values.descripcion,
          imagen_url: imagenUrl ?? values.imagen_url,
          video_url: values.video_url,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setEjercicios(ejercicios.map(e => e.id === id ? data : e));
      return data;
    } catch (err) {
      console.error('Error al actualizar ejercicio:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el ejercicio" });
      throw err;
    }
  };

  const deleteEjercicio = async (id: string) => {
    try {
      // Primero eliminar referencias en rutina_ejercicios (FK on delete restrict)
      const { error: detErr } = await supabase
        .from('rutina_ejercicios')
        .delete()
        .eq('ejercicio_id', id);
      if (detErr) throw detErr;

      // Luego eliminar el ejercicio
      const { error } = await supabase
        .from('ejercicios')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEjercicios(ejercicios.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error al eliminar ejercicio:', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el ejercicio" });
      throw err;
    }
  };

  return {
    ejercicios,
    filteredEjercicios,
    busqueda,
    setBusqueda,
    loading,
    fetchEjercicios,
    createEjercicio,
    updateEjercicio,
    deleteEjercicio,
  };
};