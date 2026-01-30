-- FORCE RLS ON EMPLEADOS (Targeted Fix)
-- The diagnostic showed 'tenant_id' is NULL for Anabelle.
-- If you see her, it means RLS is DISABLED on 'public.empleados'.

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Re-apply policy just in case
DROP POLICY IF EXISTS "Tenant Isolation for Empleados" ON public.empleados;

CREATE POLICY "Tenant Isolation for Empleados" ON public.empleados
    FOR ALL
    USING (
        tenant_id IN (SELECT public.get_my_tenants())
    );

-- Log to verify
DO $$
BEGIN
    RAISE NOTICE '✅ RLS has been ENABLED for public.empleados';
END $$;
