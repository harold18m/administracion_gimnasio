import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { diffDaysFromTodayLocal } from '@/lib/utils';

interface ExpiringMembership {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_fin: string;
  days_remaining: number;
  nombre_membresia: string;
}

export const useMembershipExpiration = () => {
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Obtener membresías próximas a vencer
  const fetchExpiringMemberships = async (daysAhead: number = 7) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_expiring_memberships', {
        days_ahead: daysAhead
      });

      if (error) throw error;
      setExpiringMemberships(data || []);
    } catch (error) {
      console.error('Error fetching expiring memberships:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías próximas a vencer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener días restantes de una membresía específica
  const getDaysRemaining = async (clientId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase.rpc('get_days_remaining', {
        client_id: clientId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting days remaining:', error);
      return null;
    }
  };

  // Renovar membresía
  const renewMembership = async (clientId: string, newMembresiaId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('renew_membership', {
        client_id: clientId,
        new_membresia_id: newMembresiaId || null
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Membresía renovada",
          description: "La membresía ha sido renovada exitosamente",
        });
        
        // Actualizar la lista de membresías próximas a vencer
        await fetchExpiringMemberships();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error renewing membership:', error);
      toast({
        title: "Error",
        description: "No se pudo renovar la membresía",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calcular estado de membresía basado en fecha de vencimiento en hora local
  const getMembershipStatus = (fechaFin: string | null): 'activa' | 'vencida' | 'por_vencer' => {
    if (!fechaFin) return 'activa';
    const diffDays = diffDaysFromTodayLocal(fechaFin);
    if (diffDays === null) return 'activa';
    if (diffDays < 0) return 'vencida';
    if (diffDays <= 7) return 'por_vencer';
    return 'activa';
  };

  // Obtener color del badge según el estado
  const getStatusColor = (status: 'activa' | 'vencida' | 'por_vencer') => {
    switch (status) {
      case 'activa':
        return 'bg-green-500';
      case 'vencida':
        return 'bg-red-500';
      case 'por_vencer':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: 'activa' | 'vencida' | 'por_vencer') => {
    switch (status) {
      case 'activa':
        return 'Activa';
      case 'vencida':
        return 'Vencida';
      case 'por_vencer':
        return 'Por vencer';
      default:
        return 'Desconocido';
    }
  };

  // Cargar membresías próximas a vencer al montar el componente
  useEffect(() => {
    fetchExpiringMemberships();
  }, []);

  return {
    expiringMemberships,
    loading,
    fetchExpiringMemberships,
    getDaysRemaining,
    renewMembership,
    getMembershipStatus,
    getStatusColor,
    getStatusText,
  };
};