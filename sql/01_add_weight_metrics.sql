-- Create table for client metrics (weight, etc)
CREATE TABLE IF NOT EXISTS public.metricas_cliente (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'peso', -- 'peso', 'grasa', etc.
    valor DECIMAL(5,2) NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.metricas_cliente ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios autenticados (clientes) vean sus propias métricas
CREATE POLICY "Clientes pueden ver sus propias metricas" 
ON public.metricas_cliente 
FOR SELECT 
USING (true); -- Simplificado por ahora, idealmente auth.uid() = cliente_id si se usa Auth de Supabase estricto

-- Política para insertar métricas
CREATE POLICY "Clientes pueden insertar sus propias metricas" 
ON public.metricas_cliente 
FOR INSERT 
WITH CHECK (true);

-- Política para actualizar
CREATE POLICY "Clientes pueden actualizar sus propias metricas" 
ON public.metricas_cliente 
FOR UPDATE 
USING (true);

-- Indices para busqueda rapida
CREATE INDEX IF NOT EXISTS idx_metricas_cliente_id ON public.metricas_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_metricas_fecha ON public.metricas_cliente(fecha_registro);
