-- Normalización y unicidad de codigo_qr en Supabase

-- =============================================
-- Tablas para Ejercicios y Rutinas
-- =============================================

-- Crear tabla ejercicios
create table if not exists public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text check (categoria in ('fuerza','cardio','flexibilidad','core','equilibrio')),
  dificultad text check (dificultad in ('principiante','intermedio','avanzado')),
  musculos text[] default array[]::text[],
  descripcion text,
  imagen_url text,
  video_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Crear tabla rutinas
create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cliente_id uuid references public.clientes(id) on delete cascade,
  notas text,
  dias text[] default array[]::text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Crear tabla rutina_ejercicios (detalle)
create table if not exists public.rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid references public.rutinas(id) on delete cascade,
  ejercicio_id uuid references public.ejercicios(id) on delete restrict,
  orden int not null default 1,
  series int,
  repeticiones text, -- flexible: "8-12" o "AMRAP"
  tempo text,
  descanso text,
  notas text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índices útiles
create index if not exists idx_ejercicios_nombre on public.ejercicios (nombre);
create index if not exists idx_rutinas_cliente on public.rutinas (cliente_id);
create index if not exists idx_rutina_ejercicios_rutina on public.rutina_ejercicios (rutina_id);
create index if not exists idx_rutina_ejercicios_orden on public.rutina_ejercicios (rutina_id, orden);

-- Trigger de updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ejercicios_set_updated_at
before update on public.ejercicios
for each row execute function public.set_updated_at();

create trigger rutinas_set_updated_at
before update on public.rutinas
for each row execute function public.set_updated_at();

create trigger rutina_ejercicios_set_updated_at
before update on public.rutina_ejercicios
for each row execute function public.set_updated_at();
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

-- =============================================
-- Storage: bucket para imágenes de ejercicios
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    IF NOT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = 'ejercicios'
    ) THEN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('ejercicios', 'ejercicios', true);
    END IF;

    -- Políticas de acceso
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public read ejercicios'
    ) THEN
      EXECUTE $cmd$
        CREATE POLICY "public read ejercicios" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'ejercicios');
      $cmd$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated insert ejercicios'
    ) THEN
      EXECUTE $cmd$
        CREATE POLICY "authenticated insert ejercicios" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'ejercicios');
      $cmd$;
    END IF;
  END IF;
END $$;