-- Agregar columna url_imagen a la tabla anuncios_kiosko
ALTER TABLE public.anuncios_kiosko
ADD COLUMN url_imagen TEXT;

-- Opcional: Migrar datos existentes
-- Si el 'tipo' era 'imagen', movemos el contenido a url_imagen
UPDATE public.anuncios_kiosko
SET url_imagen = contenido, contenido = ''
WHERE tipo = 'imagen';

-- Ya no necesitamos la columna 'tipo' obligatoriamente, pero la podemos dejar por compatibilidad
-- o eliminarla si queremos limpiar. Por seguridad la dejamos pero ya no la usaremos en el frontend.
