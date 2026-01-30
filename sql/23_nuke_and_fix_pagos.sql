-- FIX PAGOS ISOLATION (Nuclear Option)
-- 1. Dynamically DROP ALL policies on 'pagos' to remove "Permitir todo..." and any duplicates.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pagos') LOOP
        RAISE NOTICE '🔥 Destroying Policy on Pagos: %', r.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pagos', r.policyname);
    END LOOP;
END $$;

-- 2. Enable RLS (Ensure it's on)
ALTER TABLE public.pagos DISABLE ROW LEVEL SECURITY; -- Reset toggle
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- 3. Re-Create Strict Policies

-- A) Tenant Isolation
CREATE POLICY "Tenant Isolation strict" ON public.pagos
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- B) Super Admin Access
CREATE POLICY "Super Admin access" ON public.pagos
    FOR ALL
    USING ( public.is_super_admin() );

-- 4. Verify count
DO $$
DECLARE
   count_pol INTEGER;
BEGIN
   SELECT count(*) INTO count_pol FROM pg_policies WHERE tablename = 'pagos';
   RAISE NOTICE '✅ Final Policy Count for Pagos: % (Should be 2)', count_pol;
END $$;
