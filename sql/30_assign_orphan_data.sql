-- Assign orphan data (NULL tenant_id) to the main gym account
-- Tenant ID for gimnasiofit22@gmail.com: 977927df-f0ad-45be-a93e-88078da9cc8e

-- 1. Clients
UPDATE public.clientes 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 2. Payments
UPDATE public.pagos 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 3. Attendance
UPDATE public.asistencia 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 4. Announcements (Anuncios)
UPDATE public.anuncios 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 5. Employees (Empleados)
UPDATE public.empleados 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 6. Events (Eventos)
UPDATE public.eventos 
SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' 
WHERE tenant_id IS NULL;

-- 7. Routines (if applicable)
-- UPDATE public.rutinas SET tenant_id = '977927df-f0ad-45be-a93e-88078da9cc8e' WHERE tenant_id IS NULL;

SELECT 'Data migration completed: Clients, Payments, Attendance, Announcements, Employees, and Events assigned to main tenant' as status;
