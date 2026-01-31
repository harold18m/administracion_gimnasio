-- FIX ORPHAN MEMBERSHIPS
-- Runs a targeted update just for memberships to the latest tenant.

DO $$
DECLARE
    target_tenant_id UUID;
BEGIN
    -- 1. Find the most recently created tenant (your new gym)
    SELECT id INTO target_tenant_id 
    FROM public.tenants 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF target_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Error: No se encontró ningún gimnasio.';
    END IF;

    RAISE NOTICE 'Migrating orphan memberships to Gym ID: %', target_tenant_id;

    -- 2. Update Memberships
    UPDATE public.membresias 
    SET tenant_id = target_tenant_id 
    WHERE tenant_id IS NULL;

END $$;
