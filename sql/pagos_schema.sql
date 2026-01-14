-- =====================================================
-- SISTEMA DE PAGOS EN CUOTAS
-- Ejecutar este SQL en Supabase SQL Editor
-- =====================================================

-- Tabla principal de pagos (registro de membresía con plan de pago)
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  membresia_id UUID REFERENCES membresias(id),
  
  -- Montos
  monto_total DECIMAL(10,2) NOT NULL,
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  
  -- Info membresía (para referencia)
  nombre_membresia VARCHAR(255),
  
  -- Control
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
  num_cuotas INT DEFAULT 0 CHECK (num_cuotas >= 0 AND num_cuotas <= 2),
  notas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones (cada pago individual)
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  
  monto DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('adelanto', 'cuota', 'pago_completo')),
  numero_cuota INT, -- NULL para adelanto o pago completo, 1 o 2 para cuotas
  
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  fecha_transaccion TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_pago ON transacciones(pago_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente ON transacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha_transaccion);

-- Trigger para actualizar updated_at en pagos
CREATE OR REPLACE FUNCTION update_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pagos_updated_at ON pagos;
CREATE TRIGGER trigger_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_updated_at();

-- Función para actualizar monto_pagado y estado en pagos
CREATE OR REPLACE FUNCTION actualizar_estado_pago()
RETURNS TRIGGER AS $$
DECLARE
  total_pagado DECIMAL(10,2);
  monto_total_pago DECIMAL(10,2);
BEGIN
  -- Calcular total pagado
  SELECT COALESCE(SUM(monto), 0) INTO total_pagado
  FROM transacciones
  WHERE pago_id = NEW.pago_id;
  
  -- Obtener monto total del pago
  SELECT monto_total INTO monto_total_pago
  FROM pagos
  WHERE id = NEW.pago_id;
  
  -- Actualizar pagos
  UPDATE pagos
  SET 
    monto_pagado = total_pagado,
    estado = CASE
      WHEN total_pagado >= monto_total_pago THEN 'pagado'
      WHEN total_pagado > 0 THEN 'parcial'
      ELSE 'pendiente'
    END
  WHERE id = NEW.pago_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_pago ON transacciones;
CREATE TRIGGER trigger_actualizar_estado_pago
  AFTER INSERT ON transacciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_pago();

-- Habilitar RLS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir todo en pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en transacciones" ON transacciones FOR ALL USING (true) WITH CHECK (true);
