-- Funciones para el sistema de vencimiento de membresías
-- Ejecutar estas funciones en el SQL Editor de Supabase

-- Función para obtener días restantes de membresía
CREATE OR REPLACE FUNCTION get_days_remaining(client_id UUID)
RETURNS INTEGER AS $$
DECLARE
    days_left INTEGER;
BEGIN
    SELECT 
        CASE 
            WHEN fecha_fin IS NULL THEN NULL
            WHEN fecha_fin < CURRENT_DATE THEN 0
            ELSE EXTRACT(DAY FROM (fecha_fin - CURRENT_DATE))::INTEGER
        END
    INTO days_left
    FROM public.clientes
    WHERE id = client_id;
    
    RETURN days_left;
END;
$$ language 'plpgsql';

-- Función para obtener clientes con membresías próximas a vencer (7 días)
CREATE OR REPLACE FUNCTION get_expiring_memberships(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    nombre VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(20),
    fecha_fin TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    nombre_membresia VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.email,
        c.telefono,
        c.fecha_fin,
        EXTRACT(DAY FROM (c.fecha_fin - CURRENT_DATE))::INTEGER as days_remaining,
        c.nombre_membresia
    FROM public.clientes c
    WHERE c.fecha_fin IS NOT NULL 
        AND c.fecha_fin >= CURRENT_DATE 
        AND c.fecha_fin <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        AND c.estado = 'activa'
    ORDER BY c.fecha_fin ASC;
END;
$$ language 'plpgsql';

-- Función para renovar membresía automáticamente
CREATE OR REPLACE FUNCTION renew_membership(
    client_id UUID,
    new_membresia_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_membresia_duration INTEGER;
    current_membresia_id UUID;
BEGIN
    -- Obtener la membresía actual del cliente
    SELECT membresia_id INTO current_membresia_id
    FROM public.clientes
    WHERE id = client_id;
    
    -- Si no se especifica nueva membresía, usar la actual
    IF new_membresia_id IS NULL THEN
        new_membresia_id := current_membresia_id;
    END IF;
    
    -- Obtener duración de la membresía
    SELECT duracion INTO current_membresia_duration
    FROM public.membresias
    WHERE id = new_membresia_id;
    
    -- Actualizar fechas del cliente
    UPDATE public.clientes
    SET 
        fecha_inicio = CURRENT_DATE,
        fecha_fin = CURRENT_DATE + INTERVAL '1 month' * current_membresia_duration,
        estado = 'activa',
        membresia_id = new_membresia_id,
        updated_at = NOW()
    WHERE id = client_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ language 'plpgsql';