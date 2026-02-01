import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/context/TenantContext';
import { Producto, CategoriaProducto } from '@/types';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { tenant } = useTenant();

  // Cargar productos y categorías
  const fetchProductos = async () => {
    try {
      setLoading(true);
      
      // Cargar categorías
      const { data: categoriasData, error: catError } = await supabase
        .from('categorias_productos')
        .select('*')
        .order('nombre');
        
      if (catError) throw catError;
      setCategorias(categoriasData || []);

      // Cargar productos con sus categorías
      const { data: productosData, error: prodError } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:categorias_productos(nombre)
        `)
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      setProductos(productosData || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError('Error al cargar el inventario');
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear producto
  const crearProducto = async (producto: Partial<Producto>) => {
    try {
      if (!tenant?.id) throw new Error("No tenant selected");

      const { data, error } = await supabase
        .from('productos')
        .insert([{ ...producto, tenant_id: tenant.id }])
        .select()
        .single();

      if (error) throw error;

      // Recargar para traer la relación de categoría correctamente o actualizar localmente
      fetchProductos(); 
      
      toast({
        title: "Producto creado",
        description: "El producto se ha añadido al inventario",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al crear producto:', err);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Actualizar producto
  const actualizarProducto = async (id: string, updates: Partial<Producto>) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      fetchProductos();

      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProductos(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del inventario",
      });

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Gestión de Categorías
  const crearCategoria = async (nombre: string) => {
    try {
        if (!tenant?.id) throw new Error("No tenant");
        
        const { data, error } = await supabase
            .from('categorias_productos')
            .insert([{ nombre, tenant_id: tenant.id }])
            .select()
            .single();
            
        if (error) throw error;
        
        setCategorias(prev => [...prev, data]);
        toast({ title: "Categoría creada" });
        return { success: true, data };
    } catch (err) {
        toast({ title: "Error al crear categoría", variant: "destructive" });
        return { success: false, error: err };
    }
  };

  const eliminarCategoria = async (id: string) => {
      try {
          const { error } = await supabase.from('categorias_productos').delete().eq('id', id);
          if (error) throw error;
          setCategorias(prev => prev.filter(c => c.id !== id));
          toast({ title: "Categoría eliminada" });
          return { success: true };
      } catch (err) {
          toast({ title: "Error al eliminar", variant: "destructive" });
          return { success: false };
      }
  };

  // Cargar al inicio
  useEffect(() => {
    if (tenant?.id) {
        fetchProductos();
    }
  }, [tenant?.id]);

  return {
    productos,
    categorias,
    loading,
    error,
    fetchProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearCategoria,
    eliminarCategoria
  };
};
