-- FINAL SECURITY LOCKDOWN: Clientes, Membresias, Eventos
-- These tables were missed in script 12 because script 09 failed previously.

-- 1. Ensure Columns Exist
DO $$
BEGIN
    -- Clientes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='tenant_id') THEN
        ALTER TABLE public.clientes ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Membresias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='membresias' AND column_name='tenant_id') THEN
        ALTER TABLE public.membresias ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Asistencias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asistencias' AND column_name='tenant_id') THEN
        ALTER TABLE public.asistencias ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Eventos (Calendario)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eventos' AND column_name='tenant_id') THEN
        ALTER TABLE public.eventos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 2. Force RLS (Enable Security) and Set Policies

-- === CLIENTES ===
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Clientes" ON public.clientes;

CREATE POLICY "Tenant Isolation for Clientes" ON public.clientes
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- === MEMBRESIAS ===
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Membresias" ON public.membresias;

CREATE POLICY "Tenant Isolation for Membresias" ON public.membresias
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- === ASISTENCIAS ===
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Asistencias" ON public.asistencias;

CREATE POLICY "Tenant Isolation for Asistencias" ON public.asistencias
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- === EVENTOS ===
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Eventos" ON public.eventos;

CREATE POLICY "Tenant Isolation for Eventos" ON public.eventos
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 3. Super Admin Override (Optional but recommended so you don't lock yourself out if you are superadmin)
CREATE POLICY "Super Admin ve todo clientes" ON public.clientes FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super Admin ve todo membresias" ON public.membresias FOR ALL USING (public.is_super_admin());
