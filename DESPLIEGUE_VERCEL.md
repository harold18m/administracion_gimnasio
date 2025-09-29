# 🚀 Guía de Despliegue en Vercel con Supabase

## 📋 Prerrequisitos

1. **Cuenta en Vercel**: [vercel.com](https://vercel.com)
2. **Cuenta en Supabase**: [supabase.com](https://supabase.com)
3. **Repositorio en GitHub** (recomendado para despliegue automático)

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración (2-3 minutos)

### 2. Configurar Base de Datos

1. Ve a la sección **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el script `supabase-schema.sql` que está en la raíz del proyecto
3. Esto creará todas las tablas necesarias para el sistema de gimnasio

### 3. Obtener Credenciales

1. Ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Subir código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

2. **Conectar con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configurar Variables de Entorno**:
   - En la configuración del proyecto en Vercel
   - Ve a **Settings** > **Environment Variables**
   - Agrega las siguientes variables:
     ```
     VITE_SUPABASE_URL=tu_url_de_supabase
     VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
     ```

4. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Opción 2: Despliegue con Vercel CLI

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login en Vercel**:
   ```bash
   vercel login
   ```

3. **Configurar variables de entorno localmente**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

4. **Desplegar**:
   ```bash
   vercel --prod
   ```

## ⚙️ Configuración Adicional

### Configuración de CORS en Supabase

1. Ve a **Settings** > **API** en tu proyecto de Supabase
2. En **CORS origins**, agrega tu dominio de Vercel:
   ```
   https://tu-proyecto.vercel.app
   ```

### Configuración de RLS (Row Level Security)

Para mayor seguridad, puedes habilitar RLS en tus tablas:

```sql
-- Habilitar RLS en la tabla clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (para desarrollo)
CREATE POLICY "Allow all operations" ON clientes FOR ALL USING (true);

-- Repetir para otras tablas según sea necesario
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON membresias FOR ALL USING (true);
```

## 🔧 Solución de Problemas

### Error: "Missing Supabase environment variables"

- Verifica que las variables de entorno estén configuradas correctamente en Vercel
- Asegúrate de que los nombres sean exactos: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### Error de CORS

- Agrega tu dominio de Vercel a los CORS origins en Supabase
- Verifica que la URL no tenga barras finales

### Build Failures

- Ejecuta `npm run build` localmente para verificar errores
- Revisa los logs de build en Vercel para más detalles

## 📱 Funcionalidades Disponibles

Una vez desplegado, tendrás acceso a:

- ✅ **Gestión de Clientes**: CRUD completo con Supabase
- ✅ **Gestión de Membresías**: Tipos, precios y estados
- ✅ **Dashboard**: Estadísticas en tiempo real
- ✅ **Búsqueda y Filtros**: Por nombre, teléfono, email
- ✅ **Responsive Design**: Funciona en móviles y desktop

## 🔄 Actualizaciones Automáticas

Con GitHub conectado a Vercel:
- Cada push a la rama `main` desplegará automáticamente
- Los cambios se reflejan en 1-2 minutos
- Rollback automático si hay errores

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración de Supabase
3. Consulta la documentación oficial de [Vercel](https://vercel.com/docs) y [Supabase](https://supabase.com/docs)

---

¡Tu aplicación de gimnasio estará lista para usar en producción! 🎉