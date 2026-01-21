-- Add visibility column to events table
ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS visible_para_clientes BOOLEAN DEFAULT TRUE;

-- Update existing records
UPDATE public.eventos 
SET visible_para_clientes = TRUE 
WHERE tipo IN ('clase', 'evento');

UPDATE public.eventos 
SET visible_para_clientes = FALSE 
WHERE tipo = 'entrenamiento';

-- Comment on column
COMMENT ON COLUMN public.eventos.visible_para_clientes IS 'Determina si el evento es visible para los clientes en la app';
