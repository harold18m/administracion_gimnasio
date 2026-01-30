-- FIX: Make Anuncios unique per Tenant, not Global
-- Previously: UNIQUE(posicion) -> Bad for SaaS
-- Now: UNIQUE(tenant_id, posicion) -> Correct for SaaS

-- 1. Drop old constraint
ALTER TABLE public.anuncios_kiosko DROP CONSTRAINT IF EXISTS anuncios_kiosko_posicion_key;

-- 2. Add new composite constraint
-- Note: We rely on tenant_id being present.
-- If some rows have NULL tenant_id (from legacy), we might need to purge them or update them first.
DELETE FROM public.anuncios_kiosko WHERE tenant_id IS NULL; 

ALTER TABLE public.anuncios_kiosko ADD CONSTRAINT anuncios_kiosko_tenant_posicion_key UNIQUE (tenant_id, posicion);
