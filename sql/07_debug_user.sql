-- Debug script to check User and Role status
-- Replace 'gimnasiofit22@gmail.com' with the actual email if different

DO $$
DECLARE
    target_email TEXT := 'gimnasiofit22@gmail.com';
    user_record RECORD;
    role_record RECORD;
    invite_record RECORD;
BEGIN
    RAISE NOTICE '--- DEBUGGING USER: % ---', target_email;

    -- 1. Check auth.users
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;
    
    IF user_record IS NULL THEN
        RAISE NOTICE '❌ User NOT FOUND in auth.users';
        RETURN;
    ELSE
        RAISE NOTICE '✅ User found in auth.users with ID: %', user_record.id;
    END IF;

    -- 2. Check public.user_roles
    SELECT * INTO role_record FROM public.user_roles WHERE user_id = user_record.id;

    IF role_record IS NULL THEN
        RAISE NOTICE '❌ User has NO entry in public.user_roles';
    ELSE
        RAISE NOTICE '✅ User has role: % for Tenant: %', role_record.role, role_record.tenant_id;
    END IF;

    -- 3. Check Invitations (to see if any match our debugging)
    -- We can't link invitation to user easily unless we know the used token, but let's list recent ones.
    RAISE NOTICE '--- RECENT INVITATIONS ---';
    FOR invite_record IN SELECT * FROM public.tenant_invitations ORDER BY created_at DESC LIMIT 5 LOOP
        RAISE NOTICE 'Invite Token: %, Used At: %, Tenant: %', invite_record.token, invite_record.used_at, invite_record.tenant_id;
    END LOOP;

    -- 4. EMERGENCY FIX (Optional - Uncomment to apply)
    -- If user exists but has no role, and we are sure they are the owner of 'FitGym Central' (or similar),
    -- we can manually insert them.
    /*
    IF role_record IS NULL THEN
         INSERT INTO public.user_roles (user_id, tenant_id, role)
         SELECT user_record.id, id, 'owner'
         FROM public.tenants
         WHERE slug = 'fitgym-central' -- ASEGÚRATE QUE ESTE SLUG SEA CORRECTO
         LIMIT 1;
         RAISE NOTICE '🛠️ FIXED: Manually assigned Owner role to user';
    END IF;
    */
END;
$$;
