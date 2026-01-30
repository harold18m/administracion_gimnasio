-- Migración a SaaS Multitenant

-- 1. Crear tabla de Tenants (Gimnasios)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de Roles de Usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'owner', 'admin', 'staff', 'entrenador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Habilitar RLS en nuevas tablas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Añadir tenant_id a tablas existentes
-- Membresias
ALTER TABLE public.membresias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Eventos
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Asistencias
ALTER TABLE public.asistencias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 5. Eliminar tabla fingerprint_templates (ya no se usa)
DROP TABLE IF EXISTS public.fingerprint_templates;

-- 6. Función utilitaria para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO current_tenant_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1; -- Asumimos un tenant activo por sesión por ahora, o el primero encontrado
    
    RETURN current_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Políticas de RLS (Borradores iniciales)

-- Tenants: Solo Super Admin puede crear/ver todo. Admin de gimnasio ve el suyo.
CREATE POLICY "Super Admin ve todos los tenants" ON public.tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Usuarios ven su propio tenant" ON public.tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- User Roles: Super Admin gestiona todo. Owners gestionan su tenant.
CREATE POLICY "Super Admin gestiona roles" ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Owners ven roles de su tenant" ON public.user_roles
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Políticas para tablas de datos (Membresias, Clientes, etc.)
-- Se aplicarán en el siguiente paso de verificación, por ahora definimos la base.

-- Triggers para updated_at en nuevas tablas
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_membresias_tenant ON public.membresias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON public.clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tenant ON public.eventos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_tenant ON public.asistencias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles(tenant_id);
