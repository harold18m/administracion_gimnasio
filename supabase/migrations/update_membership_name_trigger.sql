-- Función para actualizar nombre_membresia y tipo_membresia
CREATE OR REPLACE FUNCTION public.update_membresia_details()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_membresia TEXT;
    v_tipo_membresia TEXT;
BEGIN
    -- Verificar si membresia_id ha cambiado
    IF NEW.membresia_id IS DISTINCT FROM OLD.membresia_id THEN
        -- Si membresia_id es NULL, limpiar campos
        IF NEW.membresia_id IS NULL THEN
            NEW.nombre_membresia := NULL;
            NEW.tipo_membresia := NULL;
        ELSE
            -- Buscar detalles en la tabla membresias
            SELECT nombre, modalidad
            INTO v_nombre_membresia, v_tipo_membresia
            FROM public.membresias
            WHERE id = NEW.membresia_id;

            -- Asignar nuevos valores
            NEW.nombre_membresia := v_nombre_membresia;
            NEW.tipo_membresia := v_tipo_membresia;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta antes de INSERT o UPDATE en clientes
DROP TRIGGER IF EXISTS trigger_update_membresia_details ON public.clientes;

CREATE TRIGGER trigger_update_membresia_details
BEFORE INSERT OR UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_membresia_details();
