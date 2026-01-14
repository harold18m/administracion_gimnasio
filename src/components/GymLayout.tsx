"use client";
import { SidebarProvider, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar";
import { GymSidebar } from '@/components/GymSidebar';
import { Bell, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';
import type { CSSProperties } from 'react';
import { useAuth } from "@/App";
import { supabase } from "@/lib/supabase";

interface EventoProximo {
  id: string;
  titulo: string;
  tipo: string;
  fecha: Date;
  cliente?: string | null;
  entrenador?: string | null;
}

interface GymLayoutProps {
  user?: User | null;
}

export function GymLayout({ user }: GymLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estado para notificaciones
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [eventosProximos, setEventosProximos] = useState<EventoProximo[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  // Cargar eventos próximos (dentro de 3 días)
  useEffect(() => {
    const cargarEventosProximos = async () => {
      try {
        setLoadingEventos(true);
        const ahora = new Date();
        const enTresDias = addDays(ahora, 3);
        
        // Formatear fechas para la consulta
        const fechaHoy = format(ahora, 'yyyy-MM-dd');
        const fechaLimite = format(enTresDias, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('eventos')
          .select('id, titulo, tipo, fecha, hora, cliente_nombre, entrenador')
          .gte('fecha', fechaHoy)
          .lte('fecha', fechaLimite)
          .eq('estado', 'programado')
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true });

        if (error) {
          console.error('Error al cargar eventos próximos:', error);
          return;
        }

        // Filtrar eventos que aún no han pasado y transformar al formato esperado
        const eventosTransformados: EventoProximo[] = (data || [])
          .map(evento => ({
            id: evento.id,
            titulo: evento.titulo,
            tipo: evento.tipo,
            fecha: new Date(`${evento.fecha}T${evento.hora}`),
            cliente: evento.cliente_nombre,
            entrenador: evento.entrenador
          }))
          .filter(evento => evento.fecha >= ahora);

        setEventosProximos(eventosTransformados);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingEventos(false);
      }
    };

    cargarEventosProximos();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarEventosProximos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const obtenerTiempoRelativo = (fecha: Date) => {
    const ahora = new Date();
    const diferencia = fecha.getTime() - ahora.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (dias === 0 && horas === 0) {
      return `En ${minutos} min`;
    } else if (dias === 0) {
      return `En ${horas}h ${minutos}min`;
    } else if (dias === 1) {
      return `Mañana ${format(fecha, 'HH:mm')}`;
    } else {
      return `En ${dias} días - ${format(fecha, 'dd/MM HH:mm')}`;
    }
  };

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrenamiento': return 'bg-blue-100 text-blue-800';
      case 'clase': return 'bg-green-100 text-green-800';
      case 'evento': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarProvider style={{
      // Sidebar más ancho en desktop
      ['--sidebar-width']: '20rem',
    } as CSSProperties}>
      <div className="min-h-screen flex w-full">
        <GymSidebar />
        <SidebarRail />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-4 md:px-6 gap-4 justify-between bg-accent/40 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <DropdownMenu open={notificacionesAbiertas} onOpenChange={setNotificacionesAbiertas}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4 md:h-5 md:w-5" />
                    {eventosProximos.length > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                      >
                        {eventosProximos.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 md:w-80" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Próximos Eventos</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Eventos en los próximos 3 días
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {eventosProximos.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay eventos próximos
                    </div>
                  ) : (
                    <div className="max-h-60 md:max-h-80 overflow-y-auto">
                      {eventosProximos.map((evento) => (
                        <DropdownMenuItem
                          key={evento.id}
                          className="flex flex-col items-start p-3 cursor-pointer"
                          onClick={() => navigate('/calendario')}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{evento.titulo}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={obtenerColorTipo(evento.tipo)}>
                                  {evento.tipo}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {obtenerTiempoRelativo(evento.fecha)}
                                </span>
                              </div>
                              {evento.cliente && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Cliente: {evento.cliente}
                                </p>
                              )}
                              {evento.entrenador && (
                                <p className="text-xs text-muted-foreground">
                                  Instructor: {evento.entrenador}
                                </p>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center justify-center text-blue-600 hover:text-blue-700"
                    onClick={() => navigate('/calendario')}
                  >
                    Ver todos los eventos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage src={(user?.user_metadata as any)?.avatar_url || (user?.user_metadata as any)?.picture || ""} alt={user?.email ?? "@usuario"} />
                      <AvatarFallback>{(user?.email ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{(user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email ?? ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/perfil")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/configuracion")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}