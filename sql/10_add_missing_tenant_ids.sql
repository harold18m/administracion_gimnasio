-- FIX: Add missing tenant_ids and Configure Shared Exercises

-- 1. Add tenant_id to remaining tables
ALTER TABLE public.ejercicios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.anuncios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ejercicios_tenant ON public.ejercicios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rutinas_tenant ON public.rutinas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tenant ON public.pagos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_empleados_tenant ON public.empleados(tenant_id);

-- 3. SHARED EXERCISES LOGIC
-- Exercises with tenant_id IS NULL are "Global" (visible to all).
-- Exercises with tenant_id = '...' are Private to that gym.

ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Ejercicios" ON public.ejercicios;

CREATE POLICY "Ver ejercicios (Global + Propios)" ON public.ejercicios
    FOR SELECT
    USING (
        tenant_id IS NULL  -- Public/Shared Exercises
        OR 
        tenant_id IN (SELECT public.get_my_tenants()) -- My Gym's Exercises
    );

CREATE POLICY "Gestionar ejercicios (Solo Propios)" ON public.ejercicios
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_owned_tenants()) -- Only Owners can manage their own
    );

-- Super Admins can manage everything (including creating Globals if they leave tenant_id null)
CREATE POLICY "Super Admin gestiona todo ejercicios" ON public.ejercicios
    FOR ALL
    USING ( public.is_super_admin() );


-- 4. SECURE OTHER TABLES (Strict Isolation)

-- Rutinas
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Rutinas" ON public.rutinas;
CREATE POLICY "Tenant Isolation for Rutinas" ON public.rutinas
    FOR ALL
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );

-- Pagos
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Pagos" ON public.pagos;
CREATE POLICY "Tenant Isolation for Pagos" ON public.pagos
    FOR ALL
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );

-- Empleados
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Empleados" ON public.empleados;
CREATE POLICY "Tenant Isolation for Empleados" ON public.empleados
    FOR ALL
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );

