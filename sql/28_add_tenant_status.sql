-- Add status column to tenants table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='status') THEN
        ALTER TABLE public.tenants ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;
