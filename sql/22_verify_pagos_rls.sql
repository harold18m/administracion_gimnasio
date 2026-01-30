-- DIAGNOSTIC: Check PAGOS Security

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pagos';

-- 2. List all policies on 'pagos'
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'pagos';

-- 3. Check for NULL tenant_ids (Data Leakage Source)
SELECT count(*) as pagos_sin_tenant 
FROM public.pagos 
WHERE tenant_id IS NULL;

-- 4. Sample data check (Safe query)
SELECT id, tenant_id, monto, fecha_pago 
FROM public.pagos 
LIMIT 5;
