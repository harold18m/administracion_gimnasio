-- Fix RLS policies for clientes table to prevent 406 errors on insert

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Enable read access for tenant users" ON public.clientes;
DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public.clientes;
DROP POLICY IF EXISTS "Enable update access for tenant users" ON public.clientes;
DROP POLICY IF EXISTS "Enable delete access for tenant users" ON public.clientes;
DROP POLICY IF EXISTS "Policy for clientes" ON public.clientes;

-- Create unified policy for all operations
-- Users can access clients if they have a role in the same tenant
CREATE POLICY "manage_clients_policy" ON public.clientes
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM user_roles 
            WHERE tenant_id = clientes.tenant_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM user_roles 
            WHERE tenant_id = clientes.tenant_id
        )
    );

-- Verify policy
SELECT * FROM pg_policies WHERE tablename = 'clientes';
