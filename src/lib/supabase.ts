import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      membresias: {
        Row: {
          id: string
          nombre: string
          descripcion: string
          tipo: 'mensual' | 'trimestral'
          modalidad: 'diario' | 'interdiario' | 'libre'
          precio: number
          duracion: number
          caracteristicas: string[]
          activa: boolean
          clientes_activos: number
          fecha_creacion: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion: string
          tipo: 'mensual' | 'trimestral'
          modalidad: 'diario' | 'interdiario' | 'libre'
          precio: number
          duracion: number
          caracteristicas: string[]
          activa?: boolean
          clientes_activos?: number
          fecha_creacion?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string
          tipo?: 'mensual' | 'trimestral'
          modalidad?: 'diario' | 'interdiario' | 'libre'
          precio?: number
          duracion?: number
          caracteristicas?: string[]
          activa?: boolean
          clientes_activos?: number
          fecha_creacion?: string
          created_at?: string
          updated_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          email: string
          telefono: string
          fecha_nacimiento: string
          fecha_registro: string
          membresia_id: string | null
          nombre_membresia: string | null
          tipo_membresia: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          estado: 'activa' | 'vencida' | 'suspendida'
          asistencias: number
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          telefono: string
          fecha_nacimiento: string
          fecha_registro?: string
          membresia_id?: string | null
          nombre_membresia?: string | null
          tipo_membresia?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          estado?: 'activa' | 'vencida' | 'suspendida'
          asistencias?: number
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          telefono?: string
          fecha_nacimiento?: string
          fecha_registro?: string
          membresia_id?: string | null
          nombre_membresia?: string | null
          tipo_membresia?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          estado?: 'activa' | 'vencida' | 'suspendida'
          asistencias?: number
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}