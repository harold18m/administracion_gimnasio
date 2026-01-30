-- KILL THE SPECIFIC ROGUE POLICY
-- Found in screenshot: "Enable write access for all users"

DROP POLICY IF EXISTS "Enable write access for all users" ON public.empleados;

-- Just in case, re-verify security is ON
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Verify final count
SELECT count(*) as policies_remaining FROM pg_policies WHERE tablename = 'empleados';
