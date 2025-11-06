-- Normalización y unicidad de codigo_qr en Supabase
-- Ejecutar este script en el SQL Editor de Supabase (proyecto correspondiente)

-- 1) Asegurar que la columna exista (no altera si ya existe)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS codigo_qr text;

-- 2) Normalizar registros existentes a mayúsculas
UPDATE public.clientes
  SET codigo_qr = UPPER(codigo_qr)
  WHERE codigo_qr IS NOT NULL AND codigo_qr <> UPPER(codigo_qr);

-- 3) Crear índice único para evitar duplicados (solo cuando hay valor)
CREATE UNIQUE INDEX IF NOT EXISTS clientes_codigo_qr_unique
  ON public.clientes (codigo_qr)
  WHERE codigo_qr IS NOT NULL;