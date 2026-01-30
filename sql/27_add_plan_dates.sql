-- ADD PLAN EXPIRATION TO TENANTS

DO $$
BEGIN
    -- Plan Expires At
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='plan_expires_at') THEN
        ALTER TABLE public.tenants ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Plan Status (Derived or Explicit) - For now we rely on date, but let's ensure we have a status if we want to manually suspend
    -- The existing 'status' column might not exist, let's check.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='status') THEN
        ALTER TABLE public.tenants ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;
