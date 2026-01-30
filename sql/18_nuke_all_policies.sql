-- DESTROY ALL POLICIES (Dynamic Logic)
-- Since we don't know the exact name of the 3rd policy, we will find it and kill it programmatically.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through ALL policies on the 'empleados' table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'empleados') LOOP
        
        RAISE NOTICE '🔥 Destroying Policy: %', r.policyname;
        
        -- Dynamic SQL to execute the drop
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.empleados', r.policyname);
        
    END LOOP;
END $$;

-- NOW RE-APPLY ONLY THE 2 GOOD ONES
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- 1. Strict Isolation
CREATE POLICY "Tenant Isolation strict" ON public.empleados
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 2. Super Admin
CREATE POLICY "Super Admin access" ON public.empleados
    FOR ALL
    USING ( public.is_super_admin() );

-- Verify Logic
DO $$
DECLARE
   count_pol INTEGER;
BEGIN
   SELECT count(*) INTO count_pol FROM pg_policies WHERE tablename = 'empleados';
   RAISE NOTICE '✅ Final Policy Count: % (Should be 2)', count_pol;
END $$;
