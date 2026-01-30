-- SAAS PLANS & LIMITS SYSTEM

-- 1. Create 'plans' table
CREATE TABLE IF NOT EXISTS public.plans (
    id VARCHAR(50) PRIMARY KEY, -- 'basic', 'pro', 'enterprise'
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    max_clients INTEGER DEFAULT 50,
    max_employees INTEGER DEFAULT 2,
    features JSONB DEFAULT '{}', -- Flexible for future features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert Default Plans
INSERT INTO public.plans (id, name, price, max_clients, max_employees) VALUES
('basic', 'Plan Básico', 29.99, 50, 2),
('premium', 'Plan Premium', 59.99, 200, 5),
('enterprise', 'Plan Enterprise', 99.99, 999999, 999999)
ON CONFLICT (id) DO UPDATE SET 
    max_clients = EXCLUDED.max_clients,
    max_employees = EXCLUDED.max_employees;

-- 3. Link tenants to plans (Foreign Key)
-- Currently tenants.plan is just a string check. We change it to FK.
-- First, ensure all existing values match a valid plan id
UPDATE public.tenants SET plan = 'basic' WHERE plan NOT IN ('basic', 'premium', 'enterprise');

-- Now alter the column
ALTER TABLE public.tenants 
    DROP CONSTRAINT IF EXISTS tenants_plan_check; -- Drop old check constraint

ALTER TABLE public.tenants 
    ADD CONSTRAINT tenants_plan_fkey FOREIGN KEY (plan) REFERENCES public.plans(id);

-- 4. Enable RLS on plans (Public Read, Admin Write)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON public.plans
    FOR SELECT USING (true); -- Public pricing page needs this

CREATE POLICY "Super Admin manages plans" ON public.plans
    FOR ALL USING (public.is_super_admin());


-- 5. FUNCTION TO CHECK LIMITS (The Enforcer)
CREATE OR REPLACE FUNCTION public.check_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    tenant_plan VARCHAR;
BEGIN
    -- Only check on INSERT
    IF (TG_OP = 'INSERT') THEN
        
        -- Get Tenant's Plan
        SELECT plan INTO tenant_plan FROM public.tenants WHERE id = NEW.tenant_id;
        
        -- Get Max Allowed for that plan
        SELECT max_clients INTO max_allowed FROM public.plans WHERE id = tenant_plan;
        
        -- Count current clients
        SELECT count(*) INTO current_count FROM public.clientes WHERE tenant_id = NEW.tenant_id;
        
        -- Check Logic
        IF (current_count >= max_allowed) THEN
            RAISE EXCEPTION 'Plan limit reached: You can only have % clients on the % plan.', max_allowed, tenant_plan;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER ON CLIENTES
DROP TRIGGER IF EXISTS check_client_limit ON public.clientes;
CREATE TRIGGER check_client_limit
    BEFORE INSERT ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_plan_limits();
