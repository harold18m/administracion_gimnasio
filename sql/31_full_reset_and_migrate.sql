-- MASTER RESET SCRIPT
-- 1. Detach all data from existing tenants (Safety Step) to prevent deletion via CASCADE
UPDATE public.clientes SET tenant_id = NULL;
UPDATE public.pagos SET tenant_id = NULL;
UPDATE public.asistencia SET tenant_id = NULL;
UPDATE public.empleados SET tenant_id = NULL;
UPDATE public.eventos SET tenant_id = NULL;
UPDATE public.anuncios_kiosko SET tenant_id = NULL;

-- 2. Delete all existing tenants (and cascaded roles/invitations)
DELETE FROM public.tenants;

-- 3. Create NEW Main Tenant
WITH new_tenant AS (
    INSERT INTO public.tenants (name, slug, plan, status)
    VALUES ('FitGym Principal', 'fitgym-principal', 'premium', 'active')
    RETURNING id
)
-- 4. Assign Owner Role to the User
INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT 
    'b404c943-c16c-4abc-b8a6-51b89d520fbd', -- Tu User ID
    id, 
    'owner'
FROM new_tenant;

-- 5. Migrate Data to New Tenant
-- We capture the new tenant ID into a temporary variable or just cross-join logic
DO $$
DECLARE
    new_tenant_id UUID;
BEGIN
    SELECT id INTO new_tenant_id FROM public.tenants LIMIT 1;

    -- Update all tables
    UPDATE public.clientes SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.pagos SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asistencia SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.empleados SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.eventos SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.anuncios_kiosko SET tenant_id = new_tenant_id WHERE tenant_id IS NULL;
    
    RAISE NOTICE 'Migration completed to Tenant ID: %', new_tenant_id;
END $$;
