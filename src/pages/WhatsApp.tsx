
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Paperclip, 
  Smile,
  Check,
  CheckCheck,
  Bot,
  Settings,
  Users,
  MessageSquare,
  Dumbbell,
  PaperclipIcon,
  Image,
  FileText
} from "lucide-react";
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
import { BotConfigPanel } from "@/features/whatsapp/BotConfigPanel";
import { ClienteBotIntegration } from "@/features/whatsapp/ClienteBotIntegration";
import { WhatsAppSetupPanel } from "@/features/whatsapp/WhatsAppSetupPanel";
import { useBotWhatsApp } from "@/features/whatsapp/useBotWhatsApp";

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
  const [tabActiva, setTabActiva] = useState("conversaciones");
  const { botConfig, estadisticas, procesarMensaje } = useBotWhatsApp();
  
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

  // Simular respuesta del bot
  const simularRespuestaBot = (mensaje: string, conversacionId: string) => {
    if (!botConfig.activo) return;

    const respuesta = procesarMensaje(mensaje, conversacionId);
    if (respuesta) {
      setTimeout(() => {
        const mensajeBot: Mensaje = {
          id: (Date.now() + 1).toString(),
          texto: respuesta,
          remitente: "yo",
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leido: false,
        };

        setConversaciones(prev =>
          prev.map((c) =>
            c.id === conversacionId
              ? {
                  ...c,
                  mensajes: [...c.mensajes, mensajeBot],
                }
              : c
          )
        );
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Business</h2>
        <p className="text-muted-foreground">
          Gestiona las conversaciones con tus clientes y configura el bot automático
        </p>
      </div>

      <div className="flex h-[800px] bg-white rounded-lg border">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conversaciones</h3>
              <div className="flex items-center gap-2">
                {botConfig.activo && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Bot className="w-3 h-3 mr-1" />
                    Bot Activo
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="conversaciones" className="text-xs">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="bot" className="text-xs">
                  <Bot className="w-4 h-4 mr-1" />
                  Bot
                </TabsTrigger>
                <TabsTrigger value="clientes" className="text-xs">
                  <Users className="w-4 h-4 mr-1" />
                  Clientes
                </TabsTrigger>
                <TabsTrigger value="api" className="text-xs">
                  <Settings className="w-4 h-4 mr-1" />
                  API
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversaciones" className="mt-4">
                {/* Búsqueda */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Lista de conversaciones */}
                <div className="flex-1 overflow-y-auto">
                  {conversacionesFiltradas.map((conversacion) => (
                    <div
                      key={conversacion.id}
                      onClick={() => setConversacionActiva(conversacion.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                        conversacionActiva === conversacion.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversacion.cliente.avatar} />
                          <AvatarFallback>{conversacion.cliente.nombre.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{conversacion.cliente.nombre}</h4>
                            <span className="text-xs text-gray-500">
                              {conversacion.mensajes[conversacion.mensajes.length - 1]?.fecha}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversacion.mensajes[conversacion.mensajes.length - 1]?.texto}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant={conversacion.cliente.estado === 'online' ? 'default' : 'secondary'} className="text-xs">
                              {conversacion.cliente.estado}
                            </Badge>
                            {conversacion.noLeidos > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversacion.noLeidos}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="bot" className="mt-4 h-[600px] overflow-y-auto">
                <BotConfigPanel />
              </TabsContent>
              
              <TabsContent value="clientes" className="mt-4 h-[600px] overflow-y-auto">
                <ClienteBotIntegration />
              </TabsContent>
              
              <TabsContent value="api" className="mt-4 h-[600px] overflow-y-auto">
                <WhatsAppSetupPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {conversacionActual ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversacionActual.cliente.avatar} />
                      <AvatarFallback>{conversacionActual.cliente.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{conversacionActual.cliente.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        {conversacionActual.cliente.estado === 'online' ? 'En línea' : 
                         conversacionActual.cliente.ultimaConexion || 'Desconectado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Silenciar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Bloquear</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversacionActual.mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    className={`flex ${mensaje.remitente === 'yo' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        mensaje.remitente === 'yo'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{mensaje.texto}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-70">{mensaje.fecha}</span>
                        {mensaje.remitente === 'yo' && (
                          mensaje.leido ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          enviarMensaje();
                          // Simular respuesta del bot si está activo
                          if (botConfig.activo && conversacionActiva) {
                            simularRespuestaBot(nuevoMensaje, conversacionActiva);
                          }
                        }
                      }}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      enviarMensaje();
                      // Simular respuesta del bot si está activo
                      if (botConfig.activo && conversacionActiva) {
                        simularRespuestaBot(nuevoMensaje, conversacionActiva);
                      }
                    }}
                    disabled={!nuevoMensaje.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500">
                  Elige una conversación del panel izquierdo para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
