-- MANUAL FIX: Assign Owner Role to User
-- Slug: manylsa-gym
-- User: gimnasiofit22@gmail.com

DO $$
DECLARE
    target_email TEXT := 'gimnasiofit22@gmail.com';
    target_slug TEXT := 'manylsa-gym';
    var_user_id UUID;
    var_tenant_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO var_user_id FROM auth.users WHERE email = target_email;
    
    IF var_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', target_email;
    END IF;

    -- 2. Get Tenant ID
    SELECT id INTO var_tenant_id FROM public.tenants WHERE slug = target_slug;

    IF var_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant % not found', target_slug;
    END IF;

    -- 3. Insert into user_roles (if not exists)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = var_user_id AND tenant_id = var_tenant_id) THEN
        INSERT INTO public.user_roles (user_id, tenant_id, role)
        VALUES (var_user_id, var_tenant_id, 'owner');
        RAISE NOTICE '✅ SUCCESS: User linked to % as Owner', target_slug;
    ELSE
        RAISE NOTICE '⚠️ User already has a role in this tenant';
    END IF;
END;
$$;
