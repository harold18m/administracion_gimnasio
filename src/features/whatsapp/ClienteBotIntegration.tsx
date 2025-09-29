import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { useClientes } from '@/features/clientes/useClientes';
import { useBotWhatsApp } from './useBotWhatsApp';
import { Cliente } from '@/features/clientes/types';

interface ClienteBotIntegrationProps {
  onClienteSeleccionado?: (cliente: Cliente) => void;
}

export function ClienteBotIntegration({ onClienteSeleccionado }: ClienteBotIntegrationProps) {
  const { clientes } = useClientes();
  const { actualizarClientes, estadisticas, obtenerConversacionesEscaladas } = useBotWhatsApp();
  const [clientesConWhatsApp, setClientesConWhatsApp] = useState<Cliente[]>([]);
  const [conversacionesEscaladas, setConversacionesEscaladas] = useState<any[]>([]);

  // Sincronizar clientes con el bot
  useEffect(() => {
    // Convertir clientes del sistema al formato del bot
    const clientesBot = clientes.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      tipoMembresia: cliente.membresia,
      fechaInicio: cliente.fechaInicio,
      fechaFin: cliente.fechaFin,
      asistencias: cliente.asistencias,
      activo: cliente.membresia === 'activa'
    }));

    actualizarClientes(clientesBot);
    
    // Filtrar clientes que tienen WhatsApp (simulado)
    const clientesWhatsApp = clientes.filter(cliente => 
      cliente.telefono && cliente.telefono.length >= 9
    );
    setClientesConWhatsApp(clientesWhatsApp);
  }, [clientes, actualizarClientes]);

  // Obtener conversaciones escaladas
  useEffect(() => {
    const escaladas = obtenerConversacionesEscaladas();
    setConversacionesEscaladas(escaladas);
  }, [obtenerConversacionesEscaladas]);

  const obtenerEstadoMembresia = (cliente: Cliente) => {
    const fechaFin = new Date(cliente.fechaFin);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (cliente.membresia === 'vencida') {
      return { estado: 'vencida', color: 'destructive', texto: 'Vencida' };
    } else if (diasRestantes <= 7 && diasRestantes > 0) {
      return { estado: 'por-vencer', color: 'outline', texto: `${diasRestantes} días` };
    } else if (cliente.membresia === 'activa') {
      return { estado: 'activa', color: 'default', texto: 'Activa' };
    } else {
      return { estado: 'pendiente', color: 'secondary', texto: 'Pendiente' };
    }
  };

  const generarMensajePersonalizado = (cliente: Cliente, tipo: 'bienvenida' | 'recordatorio' | 'vencimiento') => {
    const estadoMembresia = obtenerEstadoMembresia(cliente);
    
    switch (tipo) {
      case 'bienvenida':
        return `¡Hola ${cliente.nombre}! 👋\n\nBienvenido a FitGym. Tu membresía está ${estadoMembresia.texto.toLowerCase()}.\n\n¿En qué puedo ayudarte hoy?`;
      
      case 'recordatorio':
        return `Hola ${cliente.nombre} 🏋️‍♂️\n\nTe recordamos que tienes ${cliente.asistencias} asistencias este mes.\n\n¡Sigue así! 💪`;
      
      case 'vencimiento':
        if (estadoMembresia.estado === 'por-vencer') {
          return `Hola ${cliente.nombre} ⏰\n\nTu membresía vence en ${estadoMembresia.texto}.\n\n¿Te gustaría renovarla? Contáctanos para más información.`;
        }
        return `Hola ${cliente.nombre}\n\nTu membresía ha vencido. ¡Renuévala para seguir disfrutando de nuestros servicios!`;
      
      default:
        return `Hola ${cliente.nombre}, ¿en qué puedo ayudarte?`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas de integración */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes con WhatsApp</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesConWhatsApp.length}</div>
            <p className="text-xs text-muted-foreground">
              de {clientes.length} clientes totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones Bot</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.conversacionesAtendidas}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.conversacionesEscaladas} escaladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membresías por Vencer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientesConWhatsApp.filter(c => obtenerEstadoMembresia(c).estado === 'por-vencer').length}
            </div>
            <p className="text-xs text-muted-foreground">
              próximos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.satisfaccionCliente}%</div>
            <p className="text-xs text-muted-foreground">
              respuestas automáticas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes con WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Clientes con WhatsApp</span>
          </CardTitle>
          <CardDescription>
            Clientes registrados que pueden recibir mensajes automáticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientesConWhatsApp.slice(0, 5).map((cliente) => {
              const estadoMembresia = obtenerEstadoMembresia(cliente);
              
              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onClienteSeleccionado?.(cliente)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={cliente.avatarUrl} />
                      <AvatarFallback>
                        {cliente.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{cliente.nombre}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{cliente.telefono}</span>
                        <Mail className="h-3 w-3" />
                        <span>{cliente.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={estadoMembresia.color as "default" | "secondary" | "destructive" | "outline"}>
                      {estadoMembresia.texto}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>{cliente.asistencias}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {clientesConWhatsApp.length > 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                Ver todos los clientes ({clientesConWhatsApp.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensajes personalizados sugeridos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Mensajes Personalizados</span>
          </CardTitle>
          <CardDescription>
            Ejemplos de mensajes que el bot puede enviar automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientesConWhatsApp.slice(0, 3).map((cliente) => (
              <div key={cliente.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {cliente.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{cliente.nombre}</span>
                  </div>
                  <Badge variant="outline">Ejemplo</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <strong>Bienvenida:</strong><br />
                    {generarMensajePersonalizado(cliente, 'bienvenida')}
                  </div>
                  
                  {obtenerEstadoMembresia(cliente).estado === 'por-vencer' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                      <strong>Recordatorio de vencimiento:</strong><br />
                      {generarMensajePersonalizado(cliente, 'vencimiento')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversaciones que requieren atención */}
      {conversacionesEscaladas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Requieren Atención Humana</span>
            </CardTitle>
            <CardDescription>
              Conversaciones escaladas que necesitan respuesta manual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversacionesEscaladas.map((conversacion) => (
                <div key={conversacion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{conversacion.numeroTelefono}</p>
                      <p className="text-sm text-muted-foreground">
                        Último mensaje: {conversacion.ultimaActividad?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Atender
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}