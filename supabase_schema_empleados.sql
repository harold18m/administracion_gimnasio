-- Create table for employees
create table public.empleados (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  nombre text not null,
  email text not null,
  password text not null, -- In production, this should be hashed
  permisos jsonb null, -- Array of strings, e.g. ["dashboard", "asistencia"]
  constraint empleados_pkey primary key (id),
  constraint empleados_email_key unique (email)
) tablespace pg_default;

-- Enable RLS (Optional, but good practice)
alter table public.empleados enable row level security;

-- Policy to allow anyone to read (for login check) or restrict to admin
-- For simplicity in this app, we might allow public read or handle it via service role if possible.
-- Since we are using client-side auth for "admin", we'll allow public read for now to let the client check credentials.
create policy "Enable read access for all users" on public.empleados
  as permissive for select
  to public
  using (true);

create policy "Enable write access for all users" on public.empleados
  as permissive for all
  to public
  using (true);
