-- SECURE DATA TABLES (RLS)
-- This script explicitly enables RLS on all sensitive tables and adds policies
-- to ensure users ONLY see data from their own tenant.

-- 1. Helper function to get current tenant_id (optional but useful)
-- We'll reuse the logic directly in policies for simplicity/performance in this iteration
-- or use the `public.get_my_tenants()` if suitable, but usually efficiently we filter by :
-- tenant_id = (select tenant_id from user_roles where user_id = auth.uid() limit 1)
-- BUT for stricter isolation (multitenant users), we often filter by "tenant_id IN get_my_tenants()"

-- Re-verify function existence just in case
-- (It was created in 05_fix_recursion_final.sql)

-- LIST OF TABLES TO SECURE:
-- clientes, pagos, asistencia, membresias, ejercicios, rutinas, empleados, etc.

-- === CLIENTES ===
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Clientes" ON public.clientes;

CREATE POLICY "Tenant Isolation for Clientes" ON public.clientes
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === PAGOS ===
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Pagos" ON public.pagos;

CREATE POLICY "Tenant Isolation for Pagos" ON public.pagos
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === ASISTENCIA ===
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Asistencia" ON public.asistencia;

CREATE POLICY "Tenant Isolation for Asistencia" ON public.asistencia
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === EMPLEADOS ===
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Empleados" ON public.empleados;

CREATE POLICY "Tenant Isolation for Empleados" ON public.empleados
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === MEMBRESIAS (Planes) ===
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Membresias" ON public.membresias;

CREATE POLICY "Tenant Isolation for Membresias" ON public.membresias
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === RUTINAS ===
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Rutinas" ON public.rutinas;

CREATE POLICY "Tenant Isolation for Rutinas" ON public.rutinas
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- === EJERCICIOS ===
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation for Ejercicios" ON public.ejercicios;

CREATE POLICY "Tenant Isolation for Ejercicios" ON public.ejercicios
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );
