-- ADD LOCATION TO CRM

DO $$
BEGIN
    -- Pais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='pais') THEN
        ALTER TABLE public.crm_leads ADD COLUMN pais VARCHAR(100);
    END IF;

    -- Ciudad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='ciudad') THEN
        ALTER TABLE public.crm_leads ADD COLUMN ciudad VARCHAR(100);
    END IF;
END $$;
