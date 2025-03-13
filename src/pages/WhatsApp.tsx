
import { useState } from "react";
import {
  MessageSquare,
  Send,
  Users,
  User,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  PaperclipIcon,
  Image,
  FileText,
  Smile,
  Bot,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Mensaje {
  id: string;
  texto: string;
  remitente: "yo" | "cliente";
  fecha: string;
  leido: boolean;
}

interface Conversacion {
  id: string;
  cliente: {
    id: string;
    nombre: string;
    avatar?: string;
    telefono: string;
    estado: "online" | "offline" | "ausente";
    ultimaConexion?: string;
  };
  mensajes: Mensaje[];
  noLeidos: number;
}

// Datos de ejemplo
const conversacionesIniciales: Conversacion[] = [
  {
    id: "1",
    cliente: {
      id: "1",
      nombre: "María López",
      telefono: "+34 612 345 678",
      estado: "online",
    },
    mensajes: [
      {
        id: "1",
        texto: "Hola, quería confirmar mi clase de mañana",
        remitente: "cliente",
        fecha: "10:30 AM",
        leido: true,
      },
      {
        id: "2",
        texto: "¡Claro María! Tu clase está programada para mañana a las 18:00. ¿Necesitas algo más?",
        remitente: "yo",
        fecha: "10:32 AM",
        leido: true,
      },
      {
        id: "3",
        texto: "Perfecto, muchas gracias por confirmar!",
        remitente: "cliente",
        fecha: "10:33 AM",
        leido: true,
      },
    ],
    noLeidos: 0,
  },
  {
    id: "2",
    cliente: {
      id: "2",
      nombre: "Carlos Rodríguez",
      telefono: "+34 623 456 789",
      estado: "offline",
      ultimaConexion: "Hace 2 horas",
    },
    mensajes: [
      {
        id: "1",
        texto: "¿Tienen clases de kickboxing este fin de semana?",
        remitente: "cliente",
        fecha: "Ayer",
        leido: true,
      },
      {
        id: "2",
        texto: "Sí, tenemos clases el sábado a las 10:00 y a las 17:00. ¿Te gustaría reservar alguna?",
        remitente: "yo",
        fecha: "Ayer",
        leido: true,
      },
      {
        id: "3",
        texto: "Reservaré la de las 10:00, gracias",
        remitente: "cliente",
        fecha: "Hace 2 horas",
        leido: false,
      },
    ],
    noLeidos: 1,
  },
  {
    id: "3",
    cliente: {
      id: "3",
      nombre: "Ana Martínez",
      telefono: "+34 634 567 890",
      estado: "ausente",
      ultimaConexion: "Hace 15 minutos",
    },
    mensajes: [
      {
        id: "1",
        texto: "Quiero renovar mi suscripción mensual",
        remitente: "cliente",
        fecha: "9:45 AM",
        leido: true,
      },
      {
        id: "2",
        texto: "Por supuesto, Ana. Puedes hacerlo directamente en recepción o puedo enviarte un enlace de pago. ¿Qué prefieres?",
        remitente: "yo",
        fecha: "9:47 AM",
        leido: true,
      },
      {
        id: "3",
        texto: "Prefiero el enlace de pago, por favor",
        remitente: "cliente",
        fecha: "9:50 AM",
        leido: true,
      },
      {
        id: "4",
        texto: "Aquí tienes: https://gymoasis.com/pago/ana-martinez. ¡Gracias por renovar con nosotros!",
        remitente: "yo",
        fecha: "9:52 AM",
        leido: true,
      },
    ],
    noLeidos: 0,
  },
];

const ejerciciosParaEnviar = [
  {
    id: "1",
    nombre: "Press de Banca",
    categoria: "fuerza",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "2",
    nombre: "Sentadillas",
    categoria: "fuerza",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "3",
    nombre: "Peso Muerto",
    categoria: "fuerza",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "4",
    nombre: "Burpees",
    categoria: "cardio",
    thumbnail: "/placeholder.svg",
  },
];

export default function WhatsApp() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(conversacionesIniciales);
  const [conversacionActiva, setConversacionActiva] = useState<string | null>("1");
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  
  // Obtener la conversación activa
  const conversacionActual = conversaciones.find(
    (c) => c.id === conversacionActiva
  );
  
  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = conversaciones.filter((c) =>
    c.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  // Enviar un nuevo mensaje
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !conversacionActiva) return;
    
    const mensajeNuevo: Mensaje = {
      id: Date.now().toString(),
      texto: nuevoMensaje,
      remitente: "yo",
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
    };
    
    setConversaciones(
      conversaciones.map((c) =>
        c.id === conversacionActiva
          ? {
              ...c,
              mensajes: [...c.mensajes, mensajeNuevo],
            }
          : c
      )
    );
    
    setNuevoMensaje("");
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp</h2>
        <p className="text-muted-foreground">
          Gestiona tus conversaciones con clientes
        </p>
      </div>
      
      <div className="border rounded-lg grid grid-cols-1 md:grid-cols-3 h-[700px]">
        {/* Lista de conversaciones */}
        <div className="border-r md:col-span-1 flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar conversaciones..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {conversacionesFiltradas.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                  conv.id === conversacionActiva ? "bg-muted" : ""
                }`}
                onClick={() => setConversacionActiva(conv.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conv.cliente.avatar} />
                      <AvatarFallback>
                        {conv.cliente.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                        conv.cliente.estado === "online"
                          ? "bg-green-500"
                          : conv.cliente.estado === "ausente"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">
                        {conv.cliente.nombre}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {conv.mensajes[conv.mensajes.length - 1]?.fecha}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.mensajes[conv.mensajes.length - 1]?.texto}
                    </p>
                  </div>
                  {conv.noLeidos > 0 && (
                    <Badge className="bg-green-500 text-white">
                      {conv.noLeidos}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Área de chat */}
        <div className="md:col-span-2 flex flex-col h-full">
          {conversacionActual ? (
            <>
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conversacionActual.cliente.avatar} />
                    <AvatarFallback>
                      {conversacionActual.cliente.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">
                      {conversacionActual.cliente.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {conversacionActual.cliente.estado === "online"
                        ? "En línea"
                        : conversacionActual.cliente.ultimaConexion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver información de contacto</DropdownMenuItem>
                      <DropdownMenuItem>Silenciar notificaciones</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">Bloquear</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-auto space-y-4">
                {conversacionActual.mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    className={`flex ${
                      mensaje.remitente === "yo" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md rounded-lg p-3 ${
                        mensaje.remitente === "yo"
                          ? "bg-gym-blue text-white rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{mensaje.texto}</p>
                      <div
                        className={`text-xs mt-1 flex justify-end ${
                          mensaje.remitente === "yo" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {mensaje.fecha}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Tabs defaultValue="mensaje" className="border-t">
                <div className="flex items-center px-4 pt-2">
                  <TabsList>
                    <TabsTrigger value="mensaje" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Mensaje</span>
                    </TabsTrigger>
                    <TabsTrigger value="ejercicios" className="gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span className="hidden sm:inline">Ejercicios</span>
                    </TabsTrigger>
                    <TabsTrigger value="chatbot" className="gap-2">
                      <Bot className="h-4 w-4" />
                      <span className="hidden sm:inline">ChatBot</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="mensaje" className="p-4 pt-2">
                  <div className="flex gap-2">
                    <div className="flex gap-2 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <PaperclipIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Image className="mr-2 h-4 w-4" />
                            <span>Imagen</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Documento</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          enviarMensaje();
                        }
                      }}
                    />
                    <Button onClick={enviarMensaje}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="ejercicios" className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ejerciciosParaEnviar.map((ejercicio) => (
                      <Card key={ejercicio.id} className="cursor-pointer hover:bg-muted/50">
                        <CardHeader className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-muted p-1">
                              <Dumbbell className="h-4 w-4 text-gym-blue" />
                            </div>
                            <CardTitle className="text-sm">{ejercicio.nombre}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="aspect-video overflow-hidden rounded-md bg-muted">
                            <img
                              src={ejercicio.thumbnail}
                              alt={ejercicio.nombre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button className="w-full mt-2 text-xs">Enviar Ejercicio</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="chatbot" className="p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilizar ChatBot</CardTitle>
                      <CardDescription>
                        Envía mensajes automáticos utilizando el ChatBot
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start text-left">
                          Bienvenida a nuevos clientes
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-left">
                          Recordatorio de clases
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-left">
                          Renovación de suscripción
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-left">
                          Promociones especiales
                        </Button>
                        <div className="pt-2">
                          <Button className="w-full">Configurar Respuestas</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">Gestor de WhatsApp</h3>
              <p className="text-muted-foreground">
                Selecciona una conversación para comenzar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
