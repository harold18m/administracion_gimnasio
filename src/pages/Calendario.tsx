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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_evento: 'clase' | 'entrenamiento' | 'evento_especial' | 'mantenimiento';
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado';
  capacidad_maxima: number;
  participantes_actuales: number;
  precio: number;
  instructor: string;
  ubicacion: string;
}

const Calendario = () => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [nuevoEvento, setNuevoEvento] = useState<Partial<Evento>>({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_evento: 'clase',
    capacidad_maxima: 20,
    precio: 0,
    instructor: '',
    ubicacion: '',
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
        .order('fecha_inicio', { ascending: true });

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
  const diasDelMes = eachDayOfInterval({ start: inicioMes, end: finMes });

  const obtenerEventosDelDia = (fecha: Date) => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_inicio);
      return isSameDay(fechaEvento, fecha);
    });
  };

  const agregarEvento = async () => {
    if (!nuevoEvento.nombre || !nuevoEvento.fecha_inicio || !nuevoEvento.fecha_fin) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('eventos')
        .insert([{
          nombre: nuevoEvento.nombre,
          descripcion: nuevoEvento.descripcion || '',
          fecha_inicio: nuevoEvento.fecha_inicio,
          fecha_fin: nuevoEvento.fecha_fin,
          tipo_evento: nuevoEvento.tipo_evento || 'clase',
          capacidad_maxima: nuevoEvento.capacidad_maxima || 20,
          precio: nuevoEvento.precio || 0,
          instructor: nuevoEvento.instructor || '',
          ubicacion: nuevoEvento.ubicacion || '',
          estado: 'programado'
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

      // Recargar eventos
      await cargarEventos();
      
      // Limpiar formulario
      setNuevoEvento({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo_evento: 'clase',
        capacidad_maxima: 20,
        precio: 0,
        instructor: '',
        ubicacion: '',
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
      case 'evento_especial': return 'bg-purple-500';
      case 'mantenimiento': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrenamiento': return <Dumbbell className="h-3 w-3" />;
      case 'clase': return <Users className="h-3 w-3" />;
      case 'evento_especial': return <Star className="h-3 w-3" />;
      case 'mantenimiento': return <Clock className="h-3 w-3" />;
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
                  value={nuevoEvento.nombre}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, nombre: e.target.value})}
                  placeholder="Ej: Entrenamiento Personal - Cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo de Evento</Label>
                <Select value={nuevoEvento.tipo_evento} onValueChange={(value: 'clase' | 'entrenamiento' | 'evento_especial' | 'mantenimiento') => setNuevoEvento({...nuevoEvento, tipo_evento: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrenamiento">Entrenamiento Personal</SelectItem>
                    <SelectItem value="clase">Clase Grupal</SelectItem>
                    <SelectItem value="evento_especial">Evento Especial</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="datetime-local"
                    value={nuevoEvento.fecha_inicio}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha_inicio: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="datetime-local"
                    value={nuevoEvento.fecha_fin}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha_fin: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={nuevoEvento.instructor}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, instructor: e.target.value})}
                  placeholder="Nombre del instructor"
                />
              </div>
              
              <div>
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={nuevoEvento.ubicacion}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, ubicacion: e.target.value})}
                  placeholder="Sala, área del gimnasio"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacidad">Capacidad Máxima</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    value={nuevoEvento.capacidad_maxima}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, capacidad_maxima: parseInt(e.target.value) || 0})}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={nuevoEvento.precio}
                    onChange={(e) => setNuevoEvento({...nuevoEvento, precio: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
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
                            className={`text-xs p-1 rounded text-white ${obtenerColorTipo(evento.tipo_evento)}`}
                          >
                            <div className="flex items-center gap-1">
                              {obtenerIconoTipo(evento.tipo_evento)}
                              <span className="truncate">{format(new Date(evento.fecha_inicio), 'HH:mm')}</span>
                            </div>
                            <div className="truncate font-medium">{evento.nombre}</div>
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
              .filter(evento => new Date(evento.fecha_inicio) >= new Date())
              .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
              .slice(0, 5)
              .map(evento => (
                <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${obtenerColorTipo(evento.tipo_evento)}`}>
                      {obtenerIconoTipo(evento.tipo_evento)}
                    </div>
                    <div>
                      <div className="font-medium">{evento.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(evento.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })} - {evento.instructor}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {evento.ubicacion} • {evento.participantes_actuales}/{evento.capacidad_maxima} participantes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={evento.estado === 'programado' ? 'default' : 'secondary'}>
                      {evento.estado}
                    </Badge>
                    {evento.precio > 0 && (
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