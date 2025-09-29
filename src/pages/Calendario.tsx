import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Plus, Clock, Users, Dumbbell, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: Date;
  hora: string;
  tipo: 'entrenamiento' | 'evento' | 'clase';
  cliente?: string;
  entrenador?: string;
  duracion: number; // en minutos
  estado: 'programado' | 'completado' | 'cancelado';
}

const Calendario = () => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [eventos, setEventos] = useState<Evento[]>([
    {
      id: '1',
      titulo: 'Entrenamiento Personal - Juan Pérez',
      descripcion: 'Rutina de fuerza y cardio',
      fecha: new Date(),
      hora: '09:00',
      tipo: 'entrenamiento',
      cliente: 'Juan Pérez',
      entrenador: 'Carlos Martínez',
      duracion: 60,
      estado: 'programado'
    },
    {
      id: '2',
      titulo: 'Clase de Yoga',
      descripcion: 'Clase grupal de yoga para principiantes',
      fecha: new Date(Date.now() + 86400000), // mañana
      hora: '18:00',
      tipo: 'clase',
      entrenador: 'Ana García',
      duracion: 90,
      estado: 'programado'
    },
    {
      id: '3',
      titulo: 'Mantenimiento de Equipos',
      descripcion: 'Revisión mensual de máquinas',
      fecha: new Date(Date.now() + 172800000), // pasado mañana
      hora: '08:00',
      tipo: 'evento',
      duracion: 120,
      estado: 'programado'
    }
  ]);

  // Función para limpiar eventos antiguos (más de 1 mes)
  const cleanOldEvents = () => {
    const oneMonthAgo = subDays(new Date(), 30);
    setEventos(prevEventos => 
      prevEventos.filter(evento => new Date(evento.fecha) >= oneMonthAgo)
    );
  };

  // Ejecutar limpieza al cargar el componente y cada día
  useEffect(() => {
    cleanOldEvents();
    
    // Configurar limpieza automática cada 24 horas
    const interval = setInterval(cleanOldEvents, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const [nuevoEvento, setNuevoEvento] = useState<Partial<Evento>>({
    titulo: '',
    descripcion: '',
    fecha: new Date(),
    hora: '',
    tipo: 'entrenamiento',
    cliente: '',
    entrenador: '',
    duracion: 60,
    estado: 'programado'
  });

  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const inicioMes = startOfMonth(fechaActual);
  const finMes = endOfMonth(fechaActual);
  const diasDelMes = eachDayOfInterval({ start: inicioMes, end: finMes });

  const obtenerEventosDelDia = (fecha: Date) => {
    return eventos.filter(evento => isSameDay(evento.fecha, fecha));
  };

  const agregarEvento = () => {
    if (nuevoEvento.titulo && nuevoEvento.fecha && nuevoEvento.hora) {
      const evento: Evento = {
        id: Date.now().toString(),
        titulo: nuevoEvento.titulo!,
        descripcion: nuevoEvento.descripcion || '',
        fecha: nuevoEvento.fecha!,
        hora: nuevoEvento.hora!,
        tipo: nuevoEvento.tipo || 'entrenamiento',
        cliente: nuevoEvento.cliente,
        entrenador: nuevoEvento.entrenador,
        duracion: nuevoEvento.duracion || 60,
        estado: 'programado'
      };
      
      setEventos([...eventos, evento]);
      setNuevoEvento({
        titulo: '',
        descripcion: '',
        fecha: new Date(),
        hora: '',
        tipo: 'entrenamiento',
        cliente: '',
        entrenador: '',
        duracion: 60,
        estado: 'programado'
      });
      setDialogoAbierto(false);
    }
  };

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrenamiento': return 'bg-blue-500';
      case 'clase': return 'bg-green-500';
      case 'evento': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrenamiento': return <Dumbbell className="h-3 w-3" />;
      case 'clase': return <Users className="h-3 w-3" />;
      case 'evento': return <Star className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">
              Programa entrenamientos y gestiona eventos del gimnasio
            </p>
          </div>
        </div>
        
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Programar Nuevo Evento</DialogTitle>
              <DialogDescription>
                Crea un entrenamiento, clase o evento importante
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={nuevoEvento.titulo}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                  placeholder="Ej: Entrenamiento Personal - Cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo de Evento</Label>
                <Select value={nuevoEvento.tipo} onValueChange={(value: 'entrenamiento' | 'evento' | 'clase') => setNuevoEvento({...nuevoEvento, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrenamiento">Entrenamiento Personal</SelectItem>
                    <SelectItem value="clase">Clase Grupal</SelectItem>
                    <SelectItem value="evento">Evento/Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={nuevoEvento.fecha ? format(nuevoEvento.fecha, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: new Date(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={nuevoEvento.hora}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, hora: e.target.value})}
                  />
                </div>
              </div>
              
              {nuevoEvento.tipo === 'entrenamiento' && (
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={nuevoEvento.cliente}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, cliente: e.target.value})}
                    placeholder="Nombre del cliente"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="entrenador">Entrenador/Instructor</Label>
                <Input
                  id="entrenador"
                  value={nuevoEvento.entrenador}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, entrenador: e.target.value})}
                  placeholder="Nombre del entrenador"
                />
              </div>
              
              <div>
                <Label htmlFor="duracion">Duración (minutos)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={nuevoEvento.duracion}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, duracion: parseInt(e.target.value)})}
                  placeholder="60"
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={nuevoEvento.descripcion}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})}
                  placeholder="Detalles adicionales..."
                />
              </div>
              
              <Button onClick={agregarEvento} className="w-full">
                Programar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={vistaActual} onValueChange={(value: string) => setVistaActual(value as 'mes' | 'semana' | 'dia')}>
        <TabsList>
          <TabsTrigger value="mes">Vista Mensual</TabsTrigger>
          <TabsTrigger value="semana">Vista Semanal</TabsTrigger>
          <TabsTrigger value="dia">Vista Diaria</TabsTrigger>
        </TabsList>

        <TabsContent value="mes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {format(fechaActual, 'MMMM yyyy', { locale: es })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(subMonths(fechaActual, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(new Date())}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(addMonths(fechaActual, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
                  <div key={dia} className="p-2 text-center font-semibold text-sm text-muted-foreground">
                    {dia}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {diasDelMes.map(dia => {
                  const eventosDelDia = obtenerEventosDelDia(dia);
                  const esHoy = isSameDay(dia, new Date());
                  
                  return (
                    <div
                      key={dia.toISOString()}
                      className={`min-h-[100px] p-2 border rounded-lg ${
                        esHoy ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      } ${!isSameMonth(dia, fechaActual) ? 'opacity-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${esHoy ? 'text-blue-600' : ''}`}>
                        {format(dia, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {eventosDelDia.slice(0, 2).map(evento => (
                          <div
                            key={evento.id}
                            className={`text-xs p-1 rounded text-white ${obtenerColorTipo(evento.tipo)}`}
                          >
                            <div className="flex items-center gap-1">
                              {obtenerIconoTipo(evento.tipo)}
                              <span className="truncate">{evento.hora}</span>
                            </div>
                            <div className="truncate font-medium">{evento.titulo}</div>
                          </div>
                        ))}
                        {eventosDelDia.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{eventosDelDia.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Semanal</CardTitle>
              <CardDescription>Próximamente disponible</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="dia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Diaria</CardTitle>
              <CardDescription>Próximamente disponible</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lista de eventos próximos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>
            Entrenamientos y eventos programados para los próximos días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {eventos
              .filter(evento => evento.fecha >= new Date())
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
              .slice(0, 5)
              .map(evento => (
                <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full text-white ${obtenerColorTipo(evento.tipo)}`}>
                      {obtenerIconoTipo(evento.tipo)}
                    </div>
                    <div>
                      <h4 className="font-medium">{evento.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(evento.fecha, 'dd/MM/yyyy', { locale: es })} a las {evento.hora}
                      </p>
                      {evento.cliente && (
                        <p className="text-sm text-muted-foreground">Cliente: {evento.cliente}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {evento.duracion}min
                    </Badge>
                    <Badge variant={evento.estado === 'programado' ? 'default' : 'secondary'}>
                      {evento.estado}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendario;