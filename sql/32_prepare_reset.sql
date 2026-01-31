-- STEP 1: PREPARE RESET
-- This script detaches all data so it is safe (orphaned) and then deletes all gyms.

-- 1. Detach data (Set tenant_id to NULL)
UPDATE public.clientes SET tenant_id = NULL;
UPDATE public.pagos SET tenant_id = NULL;
UPDATE public.asistencias SET tenant_id = NULL;
UPDATE public.empleados SET tenant_id = NULL;
UPDATE public.eventos SET tenant_id = NULL;
UPDATE public.anuncios_kiosko SET tenant_id = NULL;

-- 2. Delete all tenants
-- This will also delete roles/invitations attached to tenants via CASCADE, which is desired for a clean slate.
DELETE FROM public.tenants;

SELECT 'Reset Complete. All gyms deleted. Data is safely orphaned.' as status;
