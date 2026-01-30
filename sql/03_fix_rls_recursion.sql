-- Fix RLS Infinite Recursion on user_roles

-- 1. Create a SECURITY DEFINER function to check super admin status
-- This function bypasses RLS, avoiding the recursion when querying user_roles within a user_roles policy.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policies
DROP POLICY IF EXISTS "Super Admin gestiona roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners ven roles de su tenant" ON public.user_roles;

-- 3. Re-create policies using the safe function

-- Policy: Super Admin can do EVERYTHING on user_roles
CREATE POLICY "Super Admin gestiona roles" ON public.user_roles
    FOR ALL
    USING ( public.is_super_admin() );

-- Policy: Users can can view their OWN role (Essential for Login)
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT
    USING ( auth.uid() = user_id );

-- Policy: Owners can view roles of their tenant
CREATE POLICY "Owners ven roles de su tenant" ON public.user_roles
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- 4. Update Tenants policy to also use the safe function (Good practice)
DROP POLICY IF EXISTS "Super Admin ve todos los tenants" ON public.tenants;

CREATE POLICY "Super Admin ve todos los tenants" ON public.tenants
    FOR ALL
    USING ( public.is_super_admin() );
