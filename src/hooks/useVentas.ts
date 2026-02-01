import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/context/TenantContext';
import { Venta, DetalleVenta } from '@/types';
import { useAuth } from '@/App';

export const useVentas = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { tenant } = useTenant();
    const { userRole } = useAuth(); // Assuming we can get user ID from auth context or supabase directly

    const registrarVenta = async (
        items: { producto_id: string; cantidad: number; precio_unitario: number; nombre: string }[],
        total: number,
        metodoPago: string,
        clienteId?: string | null
    ) => {
        try {
            setLoading(true);
            if (!tenant?.id) throw new Error("No tenant");
            
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Crear Venta
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert([{
                    tenant_id: tenant.id,
                    usuario_id: user?.id,
                    cliente_id: clienteId,
                    total,
                    metodo_pago: metodoPago,
                    estado: 'completada'
                }])
                .select()
                .single();

            if (ventaError) throw ventaError;

            // 2. Crear Detalles
            const detalles = items.map(item => ({
                tenant_id: tenant.id,
                venta_id: venta.id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.cantidad * item.precio_unitario
            }));

            const { error: detallesError } = await supabase
                .from('detalle_ventas')
                .insert(detalles);

            if (detallesError) {
                // Si falla el detalle, idealmente deberíamos hacer rollback o marcar venta como error,
                // pero por simplicidad sin transacciones RPC complejas, lanzamos error.
                // Supabase RLS policies might prevent deletion if not configured, careful.
                console.error("Error en detalles", detallesError);
                throw detallesError;
            }

            toast({
                title: "Venta Registrada",
                description: `Venta #${venta.id.slice(0, 8)} completada con éxito.`,
            });

            return { success: true, venta };

        } catch (err) {
            console.error('Error al registrar venta:', err);
            toast({
                title: "Error al procesar",
                description: "No se pudo registrar la venta. Intente nuevamente.",
                variant: "destructive"
            });
            return { success: false, error: err };
        } finally {
            setLoading(false);
        }
    };

    return {
        registrarVenta,
        loading
    };
};
