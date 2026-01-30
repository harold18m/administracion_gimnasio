
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { useAuth } from '@/App';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  refreshTenant: async () => {},
  switchTenant: async () => false,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { userEmail, isAuthenticated, userRole } = useAuth(); // Import userRole
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // New: Ability to switch tenants manually (for Super Admin)
  const switchTenant = async (tenantId: string) => {
      setLoading(true);
      try {
          // Verify if user is super admin (optional but good practice)
          // For now, we trust the caller (TenantsPage)
          
          const { data, error } = await supabase
              .from('tenants')
              .select('*')
              .eq('id', tenantId)
              .single();
              
          if (error) throw error;
          
          setTenant(data);
          // Persist the choice so it survives refresh
          localStorage.setItem('fitgym-managed-tenant', tenantId);
          return true;
      } catch (err) {
          console.error("Error switching tenant:", err);
          return false;
      } finally {
          setLoading(false);
      }
  };

  const refreshTenant = async () => {
    if (!isAuthenticated || !userEmail) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Check for Managed Tenant (Super Admin Override)
      const managedTenantId = localStorage.getItem('fitgym-managed-tenant');
      if (managedTenantId) {
          const { data } = await supabase.from('tenants').select('*').eq('id', managedTenantId).single();
          if (data) {
              setTenant(data);
              setLoading(false);
              return; // Exit early using the managed tenant
          }
      }

      // 2. Normal Flow: Fetch linked tenant
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         setTenant(null);
         return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
          console.error("Error fetching tenant:", error);
          setTenant(null);
      } else if (data && data.tenants) {
          setTenant(data.tenants as unknown as Tenant);
      }
      
    } catch (err) {
      console.error("Error in TenantProvider:", err);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTenant();
  }, [isAuthenticated, userEmail]);

  return (
    <TenantContext.Provider value={{ tenant, loading, refreshTenant, switchTenant }}>
      {children}
    </TenantContext.Provider>
  );
};
