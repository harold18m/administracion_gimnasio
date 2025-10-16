import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? ''

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
          dni: string | null
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
          dni?: string | null
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
          dni?: string | null
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
      , asistencias: {
        Row: {
          id: string
          evento_id: string | null
          cliente_id: string
          fecha_asistencia: string
          estado: 'presente' | 'ausente' | 'tardanza'
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          evento_id?: string | null
          cliente_id: string
          fecha_asistencia?: string
          estado?: 'presente' | 'ausente' | 'tardanza'
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          evento_id?: string | null
          cliente_id?: string
          fecha_asistencia?: string
          estado?: 'presente' | 'ausente' | 'tardanza'
          notas?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_days_remaining: {
        Args: {
          client_id: string
        }
        Returns: number | null
      }
      get_expiring_memberships: {
        Args: {
          days_ahead?: number
        }
        Returns: {
          id: string
          nombre: string
          email: string
          telefono: string
          fecha_fin: string
          days_remaining: number
          nombre_membresia: string
        }[]
      }
      renew_membership: {
        Args: {
          client_id: string
          new_membresia_id?: string
        }
        Returns: boolean
      }
    }
  }
}