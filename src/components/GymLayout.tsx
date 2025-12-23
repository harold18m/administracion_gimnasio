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
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';
import type { CSSProperties } from 'react';
import { useAuth } from "@/App";
interface GymLayoutProps {
  user?: User | null;
}

export function GymLayout({ user }: GymLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estado para notificaciones
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);

  // Datos estáticos de eventos próximos (maquetado)
  const eventosProximos = [
    {
      id: '1',
      titulo: 'Entrenamiento Personal - Juan Pérez',
      tipo: 'entrenamiento',
      fecha: new Date(Date.now() + 30 * 60 * 1000), // En 30 minutos
      cliente: 'Juan Pérez',
      entrenador: 'Carlos Mendoza'
    },
    {
      id: '2',
      titulo: 'Clase de Yoga Matutina',
      tipo: 'clase',
      fecha: new Date(Date.now() + 2 * 60 * 60 * 1000), // En 2 horas
      entrenador: 'María López'
    },
    {
      id: '3',
      titulo: 'Sesión de Crossfit',
      tipo: 'clase',
      fecha: new Date(Date.now() + 4 * 60 * 60 * 1000), // En 4 horas
      entrenador: 'Roberto Sánchez'
    }
  ];

  const obtenerTiempoRelativo = (fecha: Date) => {
    const ahora = new Date();
    const diferencia = fecha.getTime() - ahora.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (horas === 0) {
      return `En ${minutos} min`;
    } else if (horas < 24) {
      return `En ${horas}h ${minutos}min`;
    }
    return format(fecha, 'HH:mm', { locale: es });
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
                {/* <DropdownMenuTrigger asChild>
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
                </DropdownMenuTrigger> */}
                <DropdownMenuContent className="w-72 md:w-80" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Próximos Eventos</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Eventos en las próximas 24 horas
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
                  {/* <DropdownMenuItem
                    className="text-center justify-center text-blue-600 hover:text-blue-700"
                    onClick={() => router.push('/calendario')}
                  >
                    Ver todos los eventos
                  </DropdownMenuItem> */}
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