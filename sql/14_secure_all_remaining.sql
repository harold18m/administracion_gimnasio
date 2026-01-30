-- FINAL SECURITY SWEEP: Empleados, Pagos, Rutinas
-- Ensuring RLS is ENABLED for these tables.

-- 1. Check/Add tenant_id columns
DO $$
BEGIN
    -- Empleados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empleados' AND column_name='tenant_id') THEN
        ALTER TABLE public.empleados ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Pagos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='tenant_id') THEN
        ALTER TABLE public.pagos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Rutinas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rutinas' AND column_name='tenant_id') THEN
        ALTER TABLE public.rutinas ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 2. EMPLEADOS
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Empleados" ON public.empleados;

CREATE POLICY "Tenant Isolation for Empleados" ON public.empleados
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 3. PAGOS
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Pagos" ON public.pagos;

CREATE POLICY "Tenant Isolation for Pagos" ON public.pagos
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 4. RUTINAS
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Rutinas" ON public.rutinas;

CREATE POLICY "Tenant Isolation for Rutinas" ON public.rutinas
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 5. Extra check for Metrics (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metricas_cliente') THEN
        ALTER TABLE public.metricas_cliente ENABLE ROW LEVEL SECURITY;
        -- Assuming metricas_cliente follows client, direct RLS might be tricky without join, 
        -- but if it has tenant_id add it. If not, usually we secure via client. 
        -- For now, let's just Try to enable RLS to be safe (it might block access if no policy, which is better than leaking).
    END IF;
END $$;

-- 6. Super Admin Access
CREATE POLICY "Super Admin ve TODO Empleados" ON public.empleados FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super Admin ve TODO Pagos" ON public.pagos FOR ALL USING (public.is_super_admin());
