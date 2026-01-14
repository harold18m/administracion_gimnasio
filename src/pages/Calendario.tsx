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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, subDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss or HH:mm
  tipo: 'entrenamiento' | 'evento' | 'clase';
  estado: 'programado' | 'completado' | 'cancelado';
  cliente_id?: string | null;
  cliente_nombre?: string | null;
  entrenador?: string | null;
  duracion: number;
  max_participantes: number;
  participantes_actuales: number;
  precio: number | null;
  notas?: string | null;
}

const Calendario = () => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [nuevoEvento, setNuevoEvento] = useState<Partial<Evento>>({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    tipo: 'entrenamiento',
    max_participantes: 20,
    precio: 0,
    entrenador: '',
    cliente_nombre: '',
    notas: '',
    estado: 'programado'
  });

  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  // Cargar eventos desde Supabase
  const cargarEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) {
        console.error('Error al cargar eventos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        });
        return;
      }

      setEventos(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const inicioMes = startOfMonth(fechaActual);
  const finMes = endOfMonth(fechaActual);
  // Extiende al rango semanal completo (domingo a sábado) para que la cuadrícula mensual siempre muestre semanas completas
  const inicioCuadricula = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const finCuadricula = endOfWeek(finMes, { weekStartsOn: 0 });
  const diasDelMes = eachDayOfInterval({ start: inicioCuadricula, end: finCuadricula });

  const obtenerEventosDelDia = (fecha: Date) => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(`${evento.fecha}T${evento.hora}`);
      return isSameDay(fechaEvento, fecha);
    });
  };

  const agregarEvento = async () => {
    if (!nuevoEvento.titulo || !nuevoEvento.fecha || !nuevoEvento.hora) {
      toast({
        title: "Error",
        description: "Por favor completa el título, fecha y hora",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('eventos')
        .insert([{ 
          titulo: nuevoEvento.titulo!,
          descripcion: nuevoEvento.descripcion || '',
          fecha: nuevoEvento.fecha!,
          hora: nuevoEvento.hora!,
          tipo: nuevoEvento.tipo || 'entrenamiento',
          max_participantes: nuevoEvento.max_participantes || 1,
          precio: nuevoEvento.precio ?? 0,
          entrenador: nuevoEvento.entrenador || null,
          cliente_nombre: nuevoEvento.cliente_nombre || null,
          notas: nuevoEvento.notas || '',
          estado: 'programado',
        }])
        .select();

      if (error) {
        console.error('Error al crear evento:', error);
        toast({
          title: "Error",
          description: "No se pudo crear el evento",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Evento creado correctamente",
      });

      await cargarEventos();

      setNuevoEvento({
        titulo: '',
        descripcion: '',
        fecha: '',
        hora: '',
        tipo: 'entrenamiento',
        max_participantes: 20,
        precio: 0,
        entrenador: '',
        cliente_nombre: '',
        notas: '',
        estado: 'programado'
      });
      setDialogoAbierto(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
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
                  value={nuevoEvento.titulo || ''}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value })}
                  placeholder="Ej: Entrenamiento Personal - Cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo de Evento</Label>
                <Select value={nuevoEvento.tipo} onValueChange={(value: 'clase' | 'entrenamiento' | 'evento') => setNuevoEvento({ ...nuevoEvento, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrenamiento">Entrenamiento Personal</SelectItem>
                    <SelectItem value="clase">Clase Grupal</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevoEvento.fecha || ''}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
                />
              </div>

              <div>
                <Label>Hora</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={nuevoEvento.hora ? nuevoEvento.hora.split(':')[0] : ''} 
                    onValueChange={(hour) => {
                      const currentMinute = nuevoEvento.hora?.split(':')[1] || '00';
                      setNuevoEvento({ ...nuevoEvento, hora: `${hour}:${currentMinute}` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="06">6:00 AM</SelectItem>
                      <SelectItem value="07">7:00 AM</SelectItem>
                      <SelectItem value="08">8:00 AM</SelectItem>
                      <SelectItem value="09">9:00 AM</SelectItem>
                      <SelectItem value="10">10:00 AM</SelectItem>
                      <SelectItem value="11">11:00 AM</SelectItem>
                      <SelectItem value="12">12:00 PM</SelectItem>
                      <SelectItem value="13">1:00 PM</SelectItem>
                      <SelectItem value="14">2:00 PM</SelectItem>
                      <SelectItem value="15">3:00 PM</SelectItem>
                      <SelectItem value="16">4:00 PM</SelectItem>
                      <SelectItem value="17">5:00 PM</SelectItem>
                      <SelectItem value="18">6:00 PM</SelectItem>
                      <SelectItem value="19">7:00 PM</SelectItem>
                      <SelectItem value="20">8:00 PM</SelectItem>
                      <SelectItem value="21">9:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={nuevoEvento.hora?.split(':')[1] || '00'} 
                    onValueChange={(minute) => {
                      const currentHour = nuevoEvento.hora?.split(':')[0] || '08';
                      setNuevoEvento({ ...nuevoEvento, hora: `${currentHour}:${minute}` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">:00</SelectItem>
                      <SelectItem value="30">:30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={nuevoEvento.descripcion || ''}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={3}
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
                              <span className="truncate">{format(new Date(`${evento.fecha}T${evento.hora}`), 'HH:mm')}</span>
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
              .filter(evento => new Date(`${evento.fecha}T${evento.hora}`) >= new Date())
              .sort((a, b) => new Date(`${a.fecha}T${a.hora}`).getTime() - new Date(`${b.fecha}T${b.hora}`).getTime())
              .slice(0, 5)
              .map(evento => (
                <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${obtenerColorTipo(evento.tipo)}`}>{obtenerIconoTipo(evento.tipo)}</div>
                    <div>
                      <div className="font-medium">{evento.titulo}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(`${evento.fecha}T${evento.hora}`), 'dd/MM/yyyy HH:mm', { locale: es })} - {evento.entrenador || 'Sin entrenador'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {evento.participantes_actuales}/{evento.max_participantes} participantes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={evento.estado === 'programado' ? 'default' : 'secondary'}>
                      {evento.estado}
                    </Badge>
                    {(evento.precio ?? 0) > 0 && (
                      <div className="text-sm font-medium text-green-600">
                        ${evento.precio}
                      </div>
                    )}
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