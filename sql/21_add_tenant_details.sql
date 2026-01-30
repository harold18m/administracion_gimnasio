-- ADD CONTACT DETAILS TO TENANTS
-- Adding columns for Country, City, and Phone

DO $$
BEGIN
    -- Pais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='pais') THEN
        ALTER TABLE public.tenants ADD COLUMN pais VARCHAR(100);
    END IF;

    -- Ciudad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='ciudad') THEN
        ALTER TABLE public.tenants ADD COLUMN ciudad VARCHAR(100);
    END IF;
    
    -- Telefono
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='telefono') THEN
        ALTER TABLE public.tenants ADD COLUMN telefono VARCHAR(20);
    END IF;
END $$;
