-- PURGE AND RESET POLICIES FOR EMPLEADOS
-- The user sees 4 policies (Shield Icon '4'). We only want 1 or 2.
-- Access is likely leaking through an old propermissive policy.

-- 1. DROP EVERYTHING (Aggressive Cleanup)
DROP POLICY IF EXISTS "Tenant Isolation for Empleados" ON public.empleados;
DROP POLICY IF EXISTS "Super Admin ve TODO Empleados" ON public.empleados;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.empleados;
DROP POLICY IF EXISTS "Public employees" ON public.empleados;
DROP POLICY IF EXISTS "Authenticated users" ON public.empleados;
-- Try dropping by generic names just in case
DROP POLICY IF EXISTS "select_empleados" ON public.empleados;
DROP POLICY IF EXISTS "read_empleados" ON public.empleados;

-- 2. RESET RLS
ALTER TABLE public.empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- 3. APPLY SINGLE STRICT POLICY
CREATE POLICY "Tenant Isolation strict" ON public.empleados
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- 4. APPLY SUPER ADMIN BACKDOOR (Optional, safe)
CREATE POLICY "Super Admin access" ON public.empleados
    FOR ALL
    USING ( public.is_super_admin() );

-- 5. DIAGNOSTIC: Verify count of policies
SELECT count(*) as total_policies
FROM pg_policies 
WHERE tablename = 'empleados';
