import { useState } from 'react';
import {
  Bot,
  Settings,
  Clock,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBotWhatsApp } from './useBotWhatsApp';
import { RespuestaAutomatica } from './types';

interface BotConfigPanelProps {
  onClose?: () => void;
}

export function BotConfigPanel({ onClose }: BotConfigPanelProps) {
  const {
    botConfig,
    respuestasAutomaticas,
    estadisticas,
    toggleBot,
    actualizarConfigBot,
    agregarRespuestaAutomatica,
    editarRespuestaAutomatica,
    eliminarRespuestaAutomatica,
    obtenerSugerenciasMejora
  } = useBotWhatsApp();

  const [editandoRespuesta, setEditandoRespuesta] = useState<RespuestaAutomatica | null>(null);
  const [nuevaRespuesta, setNuevaRespuesta] = useState<Partial<RespuestaAutomatica>>({
    keywords: [],
    respuesta: '',
    activa: true,
    categoria: 'general',
    prioridad: 1
  });
  const [dialogAbierto, setDialogAbierto] = useState(false);

  const handleGuardarConfiguracion = () => {
    // Aquí se guardaría la configuración en el backend
    console.log('Guardando configuración:', botConfig);
  };

  const handleAgregarRespuesta = () => {
    if (nuevaRespuesta.keywords && nuevaRespuesta.respuesta) {
      agregarRespuestaAutomatica({
        keywords: typeof nuevaRespuesta.keywords === 'string' 
          ? nuevaRespuesta.keywords.split(',').map(k => k.trim())
          : nuevaRespuesta.keywords,
        respuesta: nuevaRespuesta.respuesta,
        activa: nuevaRespuesta.activa || true,
        categoria: nuevaRespuesta.categoria || 'general',
        prioridad: nuevaRespuesta.prioridad || 1
      });
      
      setNuevaRespuesta({
        keywords: [],
        respuesta: '',
        activa: true,
        categoria: 'general',
        prioridad: 1
      });
      setDialogAbierto(false);
    }
  };

  const sugerencias = obtenerSugerenciasMejora();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Configuración del Bot</h2>
            <p className="text-muted-foreground">
              Gestiona las respuestas automáticas de WhatsApp
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={botConfig.activo ? "default" : "secondary"}>
            {botConfig.activo ? "Activo" : "Inactivo"}
          </Badge>
          <Switch
            checked={botConfig.activo}
            onCheckedChange={toggleBot}
          />
        </div>
      </div>

      <Tabs defaultValue="configuracion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="sugerencias">Mejoras</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Bot</Label>
                  <Input
                    id="nombre"
                    value={botConfig.nombre}
                    onChange={(e) => actualizarConfigBot({ nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempoRespuesta">Tiempo de Respuesta (seg)</Label>
                  <Input
                    id="tiempoRespuesta"
                    type="number"
                    value={botConfig.tiempoRespuesta}
                    onChange={(e) => actualizarConfigBot({ tiempoRespuesta: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horarioInicio">Horario de Inicio</Label>
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={botConfig.horarioInicio}
                    onChange={(e) => actualizarConfigBot({ horarioInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horarioFin">Horario de Fin</Label>
                  <Input
                    id="horarioFin"
                    type="time"
                    value={botConfig.horarioFin}
                    onChange={(e) => actualizarConfigBot({ horarioFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensajeBienvenida">Mensaje de Bienvenida</Label>
                <Textarea
                  id="mensajeBienvenida"
                  value={botConfig.mensajeBienvenida}
                  onChange={(e) => actualizarConfigBot({ mensajeBienvenida: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensajeFueraHorario">Mensaje Fuera de Horario</Label>
                <Textarea
                  id="mensajeFueraHorario"
                  value={botConfig.mensajeFueraHorario}
                  onChange={(e) => actualizarConfigBot({ mensajeFueraHorario: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensajeNoEntendido">Mensaje No Entendido</Label>
                <Textarea
                  id="mensajeNoEntendido"
                  value={botConfig.mensajeNoEntendido}
                  onChange={(e) => actualizarConfigBot({ mensajeNoEntendido: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handleGuardarConfiguracion} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respuestas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Respuestas Automáticas</h3>
            <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Respuesta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Respuesta Automática</DialogTitle>
                  <DialogDescription>
                    Crea una nueva respuesta automática para el bot
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Palabras Clave (separadas por comas)</Label>
                    <Input
                      placeholder="horario, horarios, abierto, cerrado"
                      value={Array.isArray(nuevaRespuesta.keywords) 
                        ? nuevaRespuesta.keywords.join(', ')
                        : nuevaRespuesta.keywords || ''
                      }
                      onChange={(e) => setNuevaRespuesta({
                        ...nuevaRespuesta,
                        keywords: e.target.value.split(',').map(k => k.trim())
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={nuevaRespuesta.categoria}
                      onValueChange={(value) => setNuevaRespuesta({
                        ...nuevaRespuesta,
                        categoria: value as 'horarios' | 'precios' | 'clases' | 'general' | 'reservas'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horarios">Horarios</SelectItem>
                        <SelectItem value="precios">Precios</SelectItem>
                        <SelectItem value="clases">Clases</SelectItem>
                        <SelectItem value="reservas">Reservas</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Respuesta</Label>
                    <Textarea
                      placeholder="Escribe la respuesta automática..."
                      value={nuevaRespuesta.respuesta}
                      onChange={(e) => setNuevaRespuesta({
                        ...nuevaRespuesta,
                        respuesta: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={nuevaRespuesta.activa}
                      onCheckedChange={(checked) => setNuevaRespuesta({
                        ...nuevaRespuesta,
                        activa: checked
                      })}
                    />
                    <Label>Respuesta activa</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAgregarRespuesta}>
                    Agregar Respuesta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Palabras Clave</TableHead>
                    <TableHead>Respuesta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {respuestasAutomaticas.map((respuesta) => (
                    <TableRow key={respuesta.id}>
                      <TableCell>
                        <Badge variant="outline">{respuesta.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {respuesta.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {respuesta.keywords.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{respuesta.keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {respuesta.respuesta}
                      </TableCell>
                      <TableCell>
                        {respuesta.activa ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editarRespuestaAutomatica(respuesta.id, { activa: !respuesta.activa })}
                          >
                            {respuesta.activa ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditandoRespuesta(respuesta)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarRespuestaAutomatica(respuesta.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensajes Enviados</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.mensajesEnviados}</div>
                <p className="text-xs text-muted-foreground">
                  +12% desde la semana pasada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.conversacionesAtendidas}</div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas.conversacionesEscaladas} escaladas a humano
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.tiempoPromedioRespuesta}s</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de respuesta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.satisfaccionCliente}%</div>
                <p className="text-xs text-muted-foreground">
                  Satisfacción del cliente
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sugerencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sugerencias de Mejora</CardTitle>
              <CardDescription>
                Palabras frecuentes que el bot no reconoce
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sugerencias.length > 0 ? (
                <div className="space-y-2">
                  {sugerencias.map(({ palabra, frecuencia }) => (
                    <div key={palabra} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{palabra}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{frecuencia} veces</Badge>
                        <Button size="sm" variant="outline">
                          Crear Respuesta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay sugerencias disponibles en este momento.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}