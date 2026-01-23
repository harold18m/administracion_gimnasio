-- Actualizar masivamente todos los clientes existentes
-- para que coincidan con la información actual de la tabla membresias

UPDATE public.clientes c
SET 
  nombre_membresia = m.nombre,
  tipo_membresia = m.modalidad
FROM public.membresias m
WHERE c.membresia_id = m.id
  AND (
    c.nombre_membresia IS DISTINCT FROM m.nombre 
    OR c.tipo_membresia IS DISTINCT FROM m.modalidad
  );
