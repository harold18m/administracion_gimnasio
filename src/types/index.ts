export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'basic' | 'premium' | 'enterprise';
  pais?: string;
  ciudad?: string;
  telefono?: string;
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'super_admin' | 'owner' | 'admin' | 'staff' | 'entrenador';
  created_at: string;
}

// Extension to existing types (to be updated as we verify existing code)
export interface Membresia {
    id: string;
    tenant_id?: string;
    nombre: string;
    descripcion?: string;
    tipo: 'mensual' | 'trimestral';
    modalidad: 'diario' | 'interdiario' | 'libre';
    precio: number;
    duracion: number;
    caracteristicas?: string[];
    activa: boolean;
    clientes_activos: number;
}

export interface GymProfile {
    members_count: number;
    current_system: string;
    locations_count: number;
    avg_ticket: number;
}

export interface CrmLead {
    id: string;
    admin_name: string;
    role: string;
    phone: string;
    email?: string;
    pais?: string;
    ciudad?: string;
    interest_level?: 'low' | 'medium' | 'high';
    gym_profile: GymProfile;
    status: 'new' | 'contacted' | 'demo_scheduled' | 'negotiation' | 'won' | 'lost';
    notes?: string;
    created_at: string;
}
