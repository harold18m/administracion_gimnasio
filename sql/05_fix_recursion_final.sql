-- FINAL FIX for RLS Recursion
-- The issue: Querying 'user_roles' inside a policy for 'user_roles' triggers infinite recursion (RLS loop).
-- The solution: Use SECURITY DEFINER functions for ALL self-referencing checks. These functions bypass RLS.

-- 1. Helper Function: Get Tenant IDs where the user has a role
-- This replaces the direct subquery in the policies.
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT tenant_id 
  FROM public.user_roles 
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Get Tenant IDs where the user is an OWNER
CREATE OR REPLACE FUNCTION public.get_my_owned_tenants()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT tenant_id 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. DROP ALL EXISTING POLICIES (Clean Slate) to avoid conflicts
DROP POLICY IF EXISTS "Super Admin ve todos los tenants" ON public.tenants;
DROP POLICY IF EXISTS "Usuarios ven su propio tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super Admin gestiona roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners ven roles de su tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;


-- 4. RE-CREATE POLICIES using the Safe Functions

-- === TENANTS TABLE ===

-- Super Admin sees all
CREATE POLICY "Super Admin ve todos los tenants" ON public.tenants
    FOR ALL
    USING ( public.is_super_admin() );

-- Regular users see tenants they belong to
CREATE POLICY "Usuarios ven su propio tenant" ON public.tenants
    FOR SELECT
    USING ( id IN (SELECT public.get_my_tenants()) );


-- === USER_ROLES TABLE ===

-- Super Admin manages all
CREATE POLICY "Super Admin gestiona roles" ON public.user_roles
    FOR ALL
    USING ( public.is_super_admin() );

-- Users can read their OWN role (Critical for Login)
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT
    USING ( auth.uid() = user_id );

-- Owners can see other roles IN THEIR TENANTS
-- Using the function prevents the lookup from triggering RLS on itself again
CREATE POLICY "Owners ven roles de su tenant" ON public.user_roles
    FOR SELECT
    USING ( tenant_id IN (SELECT public.get_my_owned_tenants()) );

