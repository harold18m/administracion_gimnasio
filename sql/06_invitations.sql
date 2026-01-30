-- 6. Sistema de Invitaciones
-- Permite generar links únicos para que los dueños se registren en su tenant.

-- A. Tabla de Invitaciones
CREATE TABLE IF NOT EXISTS public.tenant_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    token UUID DEFAULT uuid_generate_v4() UNIQUE, -- El "código" secreto del link
    role VARCHAR(50) DEFAULT 'owner',
    used_at TIMESTAMP WITH TIME ZONE, -- Si no es NULL, ya se usó
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.tenant_invitations(tenant_id);

-- RLS
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Solo Super Admin puede crear y ver invitaciones
CREATE POLICY "Super Admin gestiona invitaciones" ON public.tenant_invitations
    FOR ALL
    USING ( public.is_super_admin() );

-- B. Función para "Canjear" invitación
-- Esta función se llama DESPUÉS de que el usuario se crea la cuenta (Auth Signup),
-- pasándole el token para vincularlo al tenant.
CREATE OR REPLACE FUNCTION public.claim_invitation(token_input UUID)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- 1. Verificar token válido y no usado
    SELECT * INTO invite_record
    FROM public.tenant_invitations
    WHERE token = token_input
    AND used_at IS NULL
    AND expires_at > NOW();

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Invitación inválida o expirada';
    END IF;

    -- 2. Asignar rol al usuario actual (auth.uid())
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (auth.uid(), invite_record.tenant_id, invite_record.role)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    -- 3. Marcar invitación como usada
    UPDATE public.tenant_invitations
    SET used_at = NOW()
    WHERE id = invite_record.id;

    RETURN jsonb_build_object('success', true, 'tenant_id', invite_record.tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
