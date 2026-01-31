-- FIX ORPHAN ROUTINES AND EXERCISES
-- Runs a targeted update for rutinas and ejercicios to the latest tenant.

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

    RAISE NOTICE 'Migrating orphan routines and exercises to Gym ID: %', target_tenant_id;

    -- 2. Update Routines (Rutinas)
    UPDATE public.rutinas 
    SET tenant_id = target_tenant_id 
    WHERE tenant_id IS NULL;

    -- 3. Update Exercises (Ejercicios) - Usually linked, good practice to migrate too if they exist
    -- We use a safe check in case the table doesn't have tenant_id or exists under a different name, 
    -- but usually they should be migrated too.
    BEGIN
        UPDATE public.ejercicios 
        SET tenant_id = target_tenant_id 
        WHERE tenant_id IS NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipping ejercicios update (maybe table does not exist or has no tenant_id)';
    END;

END $$;
