
import { useState } from "react";
import {
  Bot,
  MessageSquare,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  PlayCircle,
  PauseCircle,
  User,
  Zap,
  MessageCircle,
  Clock,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatbotMessage {
  id: string;
  nombre: string;
  mensaje: string;
  tipo: "bienvenida" | "recordatorio" | "promocion" | "preguntas" | "otro";
  activo: boolean;
}

interface ConversacionAutomatica {
  id: string;
  cliente: string;
  mensaje: string;
  fecha: string;
  estado: "completado" | "pendiente" | "error";
}

// Datos de ejemplo
const mensajesIniciales: ChatbotMessage[] = [
  {
    id: "1",
    nombre: "Bienvenida a nuevos clientes",
    mensaje: "¡Hola! Bienvenido/a a GymOasis. Estamos encantados de tenerte con nosotros. Si tienes cualquier duda o consulta, no dudes en escribirnos. 💪",
    tipo: "bienvenida",
    activo: true,
  },
  {
    id: "2",
    nombre: "Recordatorio de clase",
    mensaje: "¡Hola! Este es un recordatorio de tu clase de {clase} mañana a las {hora}. ¡Te esperamos! 🏋️",
    tipo: "recordatorio",
    activo: true,
  },
  {
    id: "3",
    nombre: "Renovación de membresía",
    mensaje: "Estimado/a {cliente}, tu membresía vence en 3 días. Renueva ahora para seguir disfrutando de nuestros servicios y no perder tu progreso. 🔄",
    tipo: "recordatorio",
    activo: true,
  },
  {
    id: "4",
    nombre: "Promoción de verano",
    mensaje: "¡Aprovecha nuestra promoción de verano! 20% de descuento en todas las membresías anuales. Oferta válida hasta el 30 de agosto. 🌞",
    tipo: "promocion",
    activo: false,
  },
  {
    id: "5",
    nombre: "Preguntas frecuentes",
    mensaje: "Puedes consultar nuestro horario, precios y servicios en nuestra web: www.gymoasis.com/info",
    tipo: "preguntas",
    activo: true,
  },
];

const conversacionesAutomaticas: ConversacionAutomatica[] = [
  {
    id: "1",
    cliente: "María López",
    mensaje: "Recordatorio de clase de Yoga",
    fecha: "Hoy, 8:00 AM",
    estado: "completado",
  },
  {
    id: "2",
    cliente: "Carlos Rodríguez",
    mensaje: "Renovación de membresía",
    fecha: "Hoy, 9:30 AM",
    estado: "completado",
  },
  {
    id: "3",
    cliente: "Ana Martínez",
    mensaje: "Bienvenida a nuevos clientes",
    fecha: "Hoy, 2:15 PM",
    estado: "pendiente",
  },
  {
    id: "4",
    cliente: "Javier López",
    mensaje: "Promoción de verano",
    fecha: "Mañana, 10:00 AM",
    estado: "pendiente",
  },
  {
    id: "5",
    cliente: "Laura García",
    mensaje: "Recordatorio de clase de Spinning",
    fecha: "15/07/2023, 7:30 AM",
    estado: "error",
  },
];

export default function ChatBot() {
  const [mensajes, setMensajes] = useState<ChatbotMessage[]>(mensajesIniciales);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<ChatbotMessage | null>(null);
  
  const agregarMensaje = (mensaje: Omit<ChatbotMessage, "id">) => {
    const nuevoMensaje = {
      ...mensaje,
      id: Date.now().toString(),
    };
    setMensajes([...mensajes, nuevoMensaje]);
    setDialogoAbierto(false);
  };
  
  const editarMensaje = (mensaje: ChatbotMessage) => {
    setMensajeSeleccionado(mensaje);
    setDialogoAbierto(true);
  };
  
  const actualizarMensaje = (mensajeActualizado: ChatbotMessage) => {
    setMensajes(
      mensajes.map((m) => (m.id === mensajeActualizado.id ? mensajeActualizado : m))
    );
    setDialogoAbierto(false);
    setMensajeSeleccionado(null);
  };
  
  const eliminarMensaje = (id: string) => {
    setMensajes(mensajes.filter((m) => m.id !== id));
  };
  
  const toggleActivacion = (id: string) => {
    setMensajes(
      mensajes.map((m) =>
        m.id === id ? { ...m, activo: !m.activo } : m
      )
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ChatBot de WhatsApp</h2>
          <p className="text-muted-foreground">
            Gestiona tus mensajes y respuestas automáticas
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mensaje
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {mensajeSeleccionado ? "Editar Mensaje" : "Crear Nuevo Mensaje"}
              </DialogTitle>
              <DialogDescription>
                Define un mensaje automático para el chatbot.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  placeholder="Nombre del mensaje"
                  className="col-span-3"
                  defaultValue={mensajeSeleccionado?.nombre}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">
                  Tipo
                </Label>
                <Select defaultValue={mensajeSeleccionado?.tipo || "bienvenida"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bienvenida">Bienvenida</SelectItem>
                    <SelectItem value="recordatorio">Recordatorio</SelectItem>
                    <SelectItem value="promocion">Promoción</SelectItem>
                    <SelectItem value="preguntas">Preguntas frecuentes</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mensaje" className="text-right">
                  Mensaje
                </Label>
                <Textarea
                  id="mensaje"
                  placeholder="Escribe el mensaje..."
                  className="col-span-3"
                  rows={5}
                  defaultValue={mensajeSeleccionado?.mensaje}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="activo" className="text-right">
                  Activo
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch id="activo" defaultChecked={mensajeSeleccionado?.activo ?? true} />
                  <Label htmlFor="activo">
                    {mensajeSeleccionado?.activo ?? true ? "Activado" : "Desactivado"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogoAbierto(false);
                  setMensajeSeleccionado(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="mensajes">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mensajes" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensajes Automáticos
          </TabsTrigger>
          <TabsTrigger value="programados" className="gap-2">
            <Calendar className="h-4 w-4" />
            Mensajes Programados
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mensajes" className="space-y-4 mt-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {mensajes.map((mensaje) => (
              <Card key={mensaje.id} className={!mensaje.activo ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-gym-blue" />
                      <CardTitle className="text-lg">{mensaje.nombre}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        mensaje.tipo === "bienvenida"
                          ? "bg-green-100 text-green-800"
                          : mensaje.tipo === "recordatorio"
                          ? "bg-blue-100 text-blue-800"
                          : mensaje.tipo === "promocion"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {mensaje.tipo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg mb-2">
                    <p className="text-sm">{mensaje.mensaje}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`switch-${mensaje.id}`}
                      checked={mensaje.activo}
                      onCheckedChange={() => toggleActivacion(mensaje.id)}
                    />
                    <Label htmlFor={`switch-${mensaje.id}`}>
                      {mensaje.activo ? "Activo" : "Inactivo"}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => editarMensaje(mensaje)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => eliminarMensaje(mensaje.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="programados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensajes Programados</CardTitle>
              <CardDescription>
                Administra los mensajes automáticos programados para ser enviados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {conversacionesAutomaticas.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Avatar>
                            <AvatarFallback>
                              {conv.cliente
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h4 className="font-medium">{conv.cliente}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {conv.mensaje}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                conv.estado === "completado"
                                  ? "bg-green-100 text-green-800"
                                  : conv.estado === "pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {conv.estado}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {conv.fecha}
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" className="gap-2">
                <PauseCircle className="h-4 w-4" />
                Pausar Todos
              </Button>
              <Button className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Programar Nuevo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="configuracion" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Ajusta la configuración básica del chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activar ChatBot</Label>
                    <p className="text-sm text-muted-foreground">
                      Enciende o apaga todas las respuestas automáticas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Respuestas automáticas</Label>
                    <p className="text-sm text-muted-foreground">
                      Responde automáticamente a mensajes entrantes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones de actividad del chatbot
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4">
                  <Button className="w-full">Guardar Configuración</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Uso</CardTitle>
                <CardDescription>
                  Información sobre el rendimiento del chatbot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Mensajes Enviados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">247</div>
                      <p className="text-xs text-muted-foreground">
                        +12% desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Tasa de Respuesta</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">68%</div>
                      <p className="text-xs text-muted-foreground">
                        +5% desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Clientes Atendidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">124</div>
                      <p className="text-xs text-muted-foreground">
                        +15% desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Tiempo Promedio</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">2.5m</div>
                      <p className="text-xs text-muted-foreground">
                        -0.5m desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
