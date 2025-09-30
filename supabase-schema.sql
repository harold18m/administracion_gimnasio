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

-- Tabla de Eventos del Calendario
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrenamiento', 'evento', 'clase')),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(255), -- Para casos donde no hay cliente registrado
    entrenador VARCHAR(255),
    duracion INTEGER NOT NULL DEFAULT 60, -- en minutos
    estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'completado', 'cancelado')),
    max_participantes INTEGER DEFAULT 1, -- Para clases grupales
    participantes_actuales INTEGER DEFAULT 0,
    precio DECIMAL(10,2), -- Para eventos pagos
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Asistencias
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    fecha_asistencia TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'presente' CHECK (estado IN ('presente', 'ausente', 'tardanza')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evento_id, cliente_id) -- Un cliente no puede tener múltiples registros para el mismo evento
);

-- Triggers para eventos
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON public.eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contador de participantes
CREATE OR REPLACE FUNCTION update_participantes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.eventos 
        SET participantes_actuales = participantes_actuales + 1 
        WHERE id = NEW.evento_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.eventos 
        SET participantes_actuales = participantes_actuales - 1 
        WHERE id = OLD.evento_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de participantes
CREATE TRIGGER update_eventos_participantes 
    AFTER INSERT OR DELETE ON public.asistencias 
    FOR EACH ROW EXECUTE FUNCTION update_participantes_count();

-- Insertar eventos de ejemplo
INSERT INTO public.eventos (titulo, descripcion, fecha, hora, tipo, cliente_nombre, entrenador, duracion, estado) VALUES
('Entrenamiento Personal - Juan Pérez', 'Rutina de fuerza y cardio', CURRENT_DATE, '09:00', 'entrenamiento', 'Juan Pérez', 'Carlos Martínez', 60, 'programado'),
('Clase de Yoga', 'Clase grupal de yoga para principiantes', CURRENT_DATE + INTERVAL '1 day', '18:00', 'clase', NULL, 'Ana García', 90, 'programado'),
('Mantenimiento de Equipos', 'Revisión mensual de máquinas', CURRENT_DATE + INTERVAL '2 days', '08:00', 'evento', NULL, NULL, 120, 'programado'),
('Clase de Spinning', 'Clase de spinning de alta intensidad', CURRENT_DATE + INTERVAL '3 days', '19:00', 'clase', NULL, 'Pedro López', 45, 'programado'),
('Entrenamiento Funcional', 'Sesión de entrenamiento funcional grupal', CURRENT_DATE + INTERVAL '4 days', '17:00', 'clase', NULL, 'María Rodríguez', 60, 'programado');

-- Habilitar Row Level Security para nuevas tablas
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Función para actualizar automáticamente el estado de membresías vencidas
CREATE OR REPLACE FUNCTION update_membership_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza fecha_fin o se inserta un nuevo cliente
    IF NEW.fecha_fin IS NOT NULL THEN
        -- Verificar si la membresía está vencida
        IF NEW.fecha_fin < CURRENT_DATE THEN
            NEW.estado = 'vencida';
        ELSIF NEW.fecha_fin >= CURRENT_DATE AND NEW.fecha_inicio <= CURRENT_DATE THEN
            NEW.estado = 'activa';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar estado automáticamente
CREATE TRIGGER update_client_membership_status 
    BEFORE INSERT OR UPDATE ON public.clientes 
    FOR EACH ROW EXECUTE FUNCTION update_membership_status();

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

-- Políticas básicas (permitir todo por ahora, se pueden refinar después)
CREATE POLICY "Permitir todo en membresias" ON public.membresias FOR ALL USING (true);
CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo en eventos" ON public.eventos FOR ALL USING (true);
CREATE POLICY "Permitir todo en asistencias" ON public.asistencias FOR ALL USING (true);