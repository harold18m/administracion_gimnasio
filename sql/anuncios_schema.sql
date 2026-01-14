-- Tabla para configuración de anuncios del Kiosko
-- Permite personalizar los paneles laterales izquierdo y derecho

CREATE TABLE IF NOT EXISTS anuncios_kiosko (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  posicion TEXT NOT NULL CHECK (posicion IN ('izquierda', 'derecha')),
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'imagen')),
  contenido TEXT, -- Texto a mostrar o URL de imagen
  titulo TEXT, -- Título opcional para el anuncio
  activo BOOLEAN DEFAULT true,
  color_fondo TEXT DEFAULT '#1a1a1a', -- Color de fondo del panel
  color_texto TEXT DEFAULT '#ffffff', -- Color del texto
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(posicion) -- Solo un anuncio por posición
);

-- Insertar configuración por defecto
INSERT INTO anuncios_kiosko (posicion, tipo, contenido, titulo, activo)
VALUES 
  ('izquierda', 'texto', '¡Bienvenido al gimnasio!', 'Información', true),
  ('derecha', 'texto', 'Horario: 6AM - 10PM', 'Horarios', true)
ON CONFLICT (posicion) DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_anuncios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_anuncios_updated_at ON anuncios_kiosko;
CREATE TRIGGER trigger_anuncios_updated_at
  BEFORE UPDATE ON anuncios_kiosko
  FOR EACH ROW
  EXECUTE FUNCTION update_anuncios_updated_at();
