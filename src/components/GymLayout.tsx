
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GymSidebar } from '@/components/GymSidebar';
import { Bell, User, Settings, LogOut } from 'lucide-react';
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
import { useAuth } from '@/App';
import { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

export function GymLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Estado para eventos próximos
  const [eventosProximos, setEventosProximos] = useState<any[]>([]);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  
  // Función para obtener eventos de las próximas 24 horas
  const obtenerEventosProximos = () => {
    // Simulamos eventos - en una app real, esto vendría de una API o contexto global
    const eventos = [
      {
        id: "1",
        titulo: "Entrenamiento Personal - Juan Pérez",
        fecha: new Date(2024, 11, 15, 10, 0),
        tipo: "entrenamiento",
        cliente: "Juan Pérez",
        entrenador: "Carlos Rodríguez",
        duracion: 60
      },
      {
        id: "2",
        titulo: "Clase de Yoga",
        fecha: new Date(2024, 11, 15, 18, 0),
        tipo: "clase",
        entrenador: "María González",
        duracion: 90
      },
      {
        id: "3",
        titulo: "Mantenimiento Equipos",
        fecha: addHours(new Date(), 2),
        tipo: "evento",
        duracion: 120
      }
    ];
    
    const ahora = new Date();
    const en24Horas = addHours(ahora, 24);
    
    const eventosFiltrados = eventos.filter(evento => 
      evento.fecha >= ahora && evento.fecha <= en24Horas
    );
    
    setEventosProximos(eventosFiltrados);
  };
  
  useEffect(() => {
    obtenerEventosProximos();
    // Actualizar cada 5 minutos
    const interval = setInterval(obtenerEventosProximos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <GymSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 gap-4 justify-between">
            <h1 className="text-2xl font-bold">FitGym</h1>
            <div className="flex items-center gap-4">
              <DropdownMenu open={notificacionesAbiertas} onOpenChange={setNotificacionesAbiertas}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {eventosProximos.length > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                      >
                        {eventosProximos.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
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
                    <div className="max-h-80 overflow-y-auto">
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
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt="@admin" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@fitgym.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/perfil")}>
                    <User className="mr-2 h-4 w-4" />
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
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
