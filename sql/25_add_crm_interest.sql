-- ADD INTEREST LEVEL TO CRM

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='interest_level') THEN
        ALTER TABLE public.crm_leads ADD COLUMN interest_level VARCHAR(20) DEFAULT 'medium' CHECK (interest_level IN ('low', 'medium', 'high'));
    END IF;
END $$;
