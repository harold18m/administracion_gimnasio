-- Esquema de base de datos para FitGym
-- Ejecutar en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Membresías
CREATE TABLE IF NOT EXISTS public.membresias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mensual', 'trimestral')),
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('diario', 'interdiario', 'libre')),
    precio DECIMAL(10,2) NOT NULL,
    duracion INTEGER NOT NULL, -- en meses
    caracteristicas TEXT[] DEFAULT '{}',
    activa BOOLEAN DEFAULT true,
    clientes_activos INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membresia_id UUID REFERENCES public.membresias(id) ON DELETE SET NULL,
    nombre_membresia VARCHAR(255),
    tipo_membresia VARCHAR(50),
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'suspendida')),
    asistencias INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_membresias_updated_at 
    BEFORE UPDATE ON public.membresias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON public.clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contador de clientes activos
CREATE OR REPLACE FUNCTION update_clientes_activos()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se asigna una nueva membresía
    IF NEW.membresia_id IS NOT NULL AND (OLD.membresia_id IS NULL OR OLD.membresia_id != NEW.membresia_id) THEN
        -- Incrementar contador de la nueva membresía
        UPDATE public.membresias 
        SET clientes_activos = clientes_activos + 1 
        WHERE id = NEW.membresia_id;
        
        -- Decrementar contador de la membresía anterior si existía
        IF OLD.membresia_id IS NOT NULL THEN
            UPDATE public.membresias 
            SET clientes_activos = clientes_activos - 1 
            WHERE id = OLD.membresia_id;
        END IF;
    END IF;
    
    -- Si se remueve una membresía
    IF NEW.membresia_id IS NULL AND OLD.membresia_id IS NOT NULL THEN
        UPDATE public.membresias 
        SET clientes_activos = clientes_activos - 1 
        WHERE id = OLD.membresia_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de clientes activos
CREATE TRIGGER update_membresias_clientes_activos 
    AFTER UPDATE ON public.clientes 
    FOR EACH ROW EXECUTE FUNCTION update_clientes_activos();

-- Trigger para cuando se inserta un nuevo cliente con membresía
CREATE OR REPLACE FUNCTION insert_cliente_with_membresia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membresia_id IS NOT NULL THEN
        UPDATE public.membresias 
        SET clientes_activos = clientes_activos + 1 
        WHERE id = NEW.membresia_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER insert_clientes_membresia 
    AFTER INSERT ON public.clientes 
    FOR EACH ROW EXECUTE FUNCTION insert_cliente_with_membresia();

-- Insertar datos de ejemplo de membresías
INSERT INTO public.membresias (nombre, descripcion, tipo, modalidad, precio, duracion, caracteristicas) VALUES
('Membresía Mensual Diaria', 'Acceso diario durante un mes completo', 'mensual', 'diario', 120.00, 1, ARRAY['Acceso todos los días', 'Todas las máquinas', 'Vestuarios', 'Asesoría básica']),
('Membresía Mensual Interdiaria', 'Acceso día por medio durante un mes', 'mensual', 'interdiario', 80.00, 1, ARRAY['Acceso día por medio', 'Todas las máquinas', 'Vestuarios', 'Plan de ejercicios']),
('Membresía Mensual Premium', 'Acceso libre durante un mes con beneficios premium', 'mensual', 'libre', 150.00, 1, ARRAY['Acceso libre', 'Todas las máquinas', 'Vestuarios premium', 'Entrenador personal', 'Clases grupales']),
('Plan Trimestral VIP', 'Plan trimestral con acceso libre y beneficios VIP', 'trimestral', 'libre', 400.00, 3, ARRAY['Acceso libre', 'Todas las máquinas', 'Vestuarios VIP', 'Entrenador personal', 'Clases grupales', 'Nutricionista']),
('Plan Trimestral Interdiario', 'Plan trimestral con acceso día por medio', 'trimestral', 'interdiario', 280.00, 3, ARRAY['Acceso día por medio', 'Todas las máquinas', 'Vestuarios', 'Plan de ejercicios', 'Seguimiento mensual']);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, se pueden refinar después)
CREATE POLICY "Permitir todo en membresias" ON public.membresias FOR ALL USING (true);
CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL USING (true);