-- Módulo de Ventas y Punto de Venta
-- Tablas: categorias_productos, productos, ventas, detalle_ventas

-- 1. Categorías de Productos
CREATE TABLE IF NOT EXISTS public.categorias_productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tenant Isolation for Categorias" ON public.categorias_productos
    FOR ALL
    USING (tenant_id IN (SELECT public.get_my_tenants()));


-- 2. Productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    categoria_id UUID REFERENCES public.categorias_productos(id) ON DELETE SET NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0,
    costo DECIMAL(10, 2) DEFAULT 0, -- Para calcular ganancias
    stock_actual INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5, -- Alerta de stock bajo
    imagen_url TEXT,
    codigo_barras VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tenant Isolation for Productos" ON public.productos
    FOR ALL
    USING (tenant_id IN (SELECT public.get_my_tenants()));

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_productos_tenant ON public.productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON public.productos(tenant_id, codigo_barras);


-- 3. Ventas (Cabecera)
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL, -- Puede ser venta anónima
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Vendedor
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo', -- efectivo, tarjeta, yape, plin, etc.
    estado VARCHAR(20) DEFAULT 'completada', -- completada, anulada
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tenant Isolation for Ventas" ON public.ventas
    FOR ALL
    USING (tenant_id IN (SELECT public.get_my_tenants()));

CREATE INDEX IF NOT EXISTS idx_ventas_tenant_fecha ON public.ventas(tenant_id, fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas(cliente_id);


-- 4. Detalle de Ventas
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL, -- Redundancia útil para RLS y queries directos
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tenant Isolation for DetalleVentas" ON public.detalle_ventas
    FOR ALL
    USING (tenant_id IN (SELECT public.get_my_tenants()));

CREATE INDEX IF NOT EXISTS idx_detalle_venta ON public.detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON public.detalle_ventas(producto_id);

-- Función para actualizar stock al vender (Opcional, pero recomendada)
CREATE OR REPLACE FUNCTION public.actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.productos
        SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.producto_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Si se anula la venta (borra detalle), se devuelve stock
        UPDATE public.productos
        SET stock_actual = stock_actual + OLD.cantidad
        WHERE id = OLD.producto_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para descontar stock
DROP TRIGGER IF EXISTS trigger_update_stock_sales ON public.detalle_ventas;
CREATE TRIGGER trigger_update_stock_sales
AFTER INSERT OR DELETE ON public.detalle_ventas
FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_venta();
