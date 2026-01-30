-- DIAGNOSIS: Check Security Status & Debug "Anabelle"
-- 1. Check if RLS is Enabled (TRUE = Safe, FALSE = Unsafe)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'user_roles', 'clientes', 'membresias', 'empleados', 'pagos', 'rutinas', 'anuncios_kiosko');

-- 2. Debug the specific employee "Anabelle" (picoro777@gmail.com)
-- We want to see if she has a tenant_id or is NULL
SELECT id, nombre, email, tenant_id 
FROM public.empleados 
WHERE email = 'picoro777@gmail.com';

-- 3. Check MY current permissions
-- See what tenant database thinks I am in
SELECT auth.uid() as my_user_id, public.get_my_tenants() as my_tenant_ids;
