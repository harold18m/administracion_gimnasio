-- STEP 2: MIGRATE TO NEW GYM & ASSIGN OWNER
-- Target User: adrianolujan2004@gmail.com

DO $$
DECLARE
    target_tenant_id UUID;
    target_user_id UUID;
    target_name TEXT;
BEGIN
    -- 1. Find the most recently created tenant
    SELECT id, name INTO target_tenant_id, target_name 
    FROM public.tenants 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF target_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Error: No se encontró ningún gimnasio. ¡Crea uno primero en el panel!';
    END IF;

    -- 2. Find the user ID for adrianolujan2004@gmail.com
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'adrianolujan2004@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Error: No se encontró el usuario con email adrianolujan2004@gmail.com';
    END IF;

    RAISE NOTICE 'Migrating data to Gym: % (ID: %) for Owner: %', target_name, target_tenant_id, target_user_id;

    -- 3. Assign Orphan Data
    UPDATE public.clientes SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.pagos SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asistencias SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.empleados SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.membresias SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.eventos SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.anuncios_kiosko SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;

    -- 4. Assign Owner Role
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (target_user_id, target_tenant_id, 'owner')
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'owner';

END $$;
