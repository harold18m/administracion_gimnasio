-- COMPLETE FIX MIGRATION (CONSOLIDATED)
-- This script combines:
-- 1. Adding missing tenant_ids (for strict isolation)
-- 2. Creating 'anuncios_kiosko' table correctly
-- 3. Fixing Unique Constraints to be multi-tenant aware
-- 4. Configuring Global/Shared Exercises logic

-- === PART 1: ENSURE TABLES EXIST & HAVE TENANT_ID ===

-- 1. Create 'anuncios_kiosko' if not exists
CREATE TABLE IF NOT EXISTS public.anuncios_kiosko (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    posicion VARCHAR(50) NOT NULL, -- Note: NOT UNIQUE globally anymore!
    titulo TEXT,
    contenido TEXT,
    url_imagen TEXT,
    tipo VARCHAR(50) DEFAULT 'texto',
    activo BOOLEAN DEFAULT true,
    color_fondo VARCHAR(20) DEFAULT '#1a1a1a',
    color_texto VARCHAR(20) DEFAULT '#ffffff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add tenant_id to all tables safely
DO $$
BEGIN
    -- Ejercicios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios' AND column_name='tenant_id') THEN
        ALTER TABLE public.ejercicios ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Rutinas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rutinas' AND column_name='tenant_id') THEN
        ALTER TABLE public.rutinas ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Pagos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='tenant_id') THEN
        ALTER TABLE public.pagos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Empleados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empleados' AND column_name='tenant_id') THEN
        ALTER TABLE public.empleados ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Anuncios Kiosko
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='anuncios_kiosko' AND column_name='tenant_id') THEN
        ALTER TABLE public.anuncios_kiosko ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ejercicios_tenant ON public.ejercicios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rutinas_tenant ON public.rutinas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tenant ON public.pagos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_empleados_tenant ON public.empleados(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_kiosko_tenant ON public.anuncios_kiosko(tenant_id);


-- === PART 2: FIX CONSTRAINTS (CRITICAL FOR ANUNCIOS) ===

-- Ensure 'posicion' is unique PER TENANT, not globally
DO $$
BEGIN
    -- Drop old unique constraint if it exists (by name or trying to find it)
    ALTER TABLE public.anuncios_kiosko DROP CONSTRAINT IF EXISTS anuncios_kiosko_posicion_key;
    
    -- Clean up legacy rows with NULL tenant_id to avoid constraint violation (Optional: Comment out if you want to keep them)
    -- DELETE FROM public.anuncios_kiosko WHERE tenant_id IS NULL; 
    
    -- Add proper SaaS constraint
    -- We use a conditional check or just try to add it. IF NOT EXISTS isn't standard for constraints, so we catch error or rely on name
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anuncios_kiosko_tenant_posicion_key') THEN
        ALTER TABLE public.anuncios_kiosko ADD CONSTRAINT anuncios_kiosko_tenant_posicion_key UNIQUE (tenant_id, posicion);
    END IF;
END $$;


-- === PART 3: CONFIGURE RLS POLICIES (SECURITY DOORS) ===

-- A. EXERCISES (Logic: Global + Private)
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Ejercicios" ON public.ejercicios;
DROP POLICY IF EXISTS "Ver ejercicios (Global + Propios)" ON public.ejercicios;
DROP POLICY IF EXISTS "Gestionar ejercicios (Solo Propios)" ON public.ejercicios;
DROP POLICY IF EXISTS "Super Admin gestiona todo ejercicios" ON public.ejercicios;

CREATE POLICY "Ver ejercicios (Global + Propios)" ON public.ejercicios
    FOR SELECT
    USING (
        tenant_id IS NULL  -- Public/Shared
        OR 
        tenant_id IN (SELECT public.get_my_tenants()) -- My Gym's
    );

CREATE POLICY "Gestionar ejercicios (Solo Propios)" ON public.ejercicios
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_owned_tenants()) -- Only Owners can manage their own
    );

CREATE POLICY "Super Admin gestiona todo ejercicios" ON public.ejercicios
    FOR ALL
    USING ( public.is_super_admin() );


-- B. STRICT ISOLATION (Other Tables)

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

-- Anuncios Kiosko
ALTER TABLE public.anuncios_kiosko ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation for Anuncios" ON public.anuncios_kiosko;
CREATE POLICY "Tenant Isolation for Anuncios" ON public.anuncios_kiosko
    FOR ALL
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );

