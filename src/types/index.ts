export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'basic' | 'premium' | 'enterprise';
  pais?: string;
  ciudad?: string;
  telefono?: string;
  status?: 'active' | 'suspended';
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

export interface CategoriaProducto {
    id: string;
    tenant_id: string;
    nombre: string;
    created_at?: string;
}

export interface Producto {
    id: string;
    tenant_id: string;
    categoria_id?: string | null;
    categoria?: CategoriaProducto; // For joined queries
    nombre: string;
    descripcion?: string;
    precio: number;
    costo?: number;
    stock_actual: number;
    min_stock?: number;
    imagen_url?: string;
    codigo_barras?: string;
    activo: boolean;
    created_at?: string;
}

export interface Venta {
    id: string;
    tenant_id: string;
    cliente_id?: string | null;
    usuario_id?: string | null;
    total: number;
    metodo_pago: string;
    estado: 'completada' | 'anulada';
    fecha: string;
    created_at?: string;
    items?: DetalleVenta[]; // For UI convenience
    cliente?: { nombre: string }; // For joined queries
}

export interface DetalleVenta {
    id: string;
    tenant_id: string;
    venta_id: string;
    producto_id?: string | null;
    producto?: { nombre: string }; // For joined queries
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    created_at?: string;
}
