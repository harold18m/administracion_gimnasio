import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  BotConfig, 
  RespuestaAutomatica, 
  ConversacionBot, 
  MensajeBot, 
  EstadisticasBot,
  respuestasIniciales,
  botConfigInicial 
} from './types';

export const useBotWhatsApp = () => {
  const [botConfig, setBotConfig] = useState<BotConfig>(botConfigInicial);
  const [respuestasAutomaticas, setRespuestasAutomaticas] = useState<RespuestaAutomatica[]>(respuestasIniciales);
  const [conversacionesBot, setConversacionesBot] = useState<ConversacionBot[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasBot>({
    mensajesEnviados: 0,
    conversacionesAtendidas: 0,
    conversacionesEscaladas: 0,
    tiempoPromedioRespuesta: 2.5,
    satisfaccionCliente: 85,
    palabrasClaveNoReconocidas: []
  });
  const { toast } = useToast();

  // Función para procesar mensaje entrante y generar respuesta automática
  const procesarMensaje = useCallback((mensaje: string, clienteId: string): string | null => {
    if (!botConfig.activo) return null;

    // Verificar horario de atención
    const ahora = new Date();
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
    const [horaInicio, minutoInicio] = botConfig.horarioInicio.split(':').map(Number);
    const [horaFin, minutoFin] = botConfig.horarioFin.split(':').map(Number);
    const horarioInicio = horaInicio * 100 + minutoInicio;
    const horarioFin = horaFin * 100 + minutoFin;

    if (horaActual < horarioInicio || horaActual > horarioFin) {
      return botConfig.mensajeFueraHorario;
    }

    // Normalizar mensaje para búsqueda
    const mensajeNormalizado = mensaje.toLowerCase().trim();
    
    // Buscar respuesta automática
    const respuestaEncontrada = respuestasAutomaticas
      .filter(r => r.activa)
      .sort((a, b) => b.prioridad - a.prioridad)
      .find(respuesta => 
        respuesta.keywords.some(keyword => 
          mensajeNormalizado.includes(keyword.toLowerCase())
        )
      );

    if (respuestaEncontrada) {
      // Actualizar estadísticas
      setEstadisticas(prev => ({
        ...prev,
        mensajesEnviados: prev.mensajesEnviados + 1
      }));

      return respuestaEncontrada.respuesta;
    }

    // Si no se encuentra respuesta, agregar palabras no reconocidas
    const palabras = mensajeNormalizado.split(' ').filter(p => p.length > 3);
    setEstadisticas(prev => ({
      ...prev,
      palabrasClaveNoReconocidas: [
        ...prev.palabrasClaveNoReconocidas,
        ...palabras
      ].slice(-50) // Mantener solo las últimas 50
    }));

    return botConfig.mensajeNoEntendido;
  }, [botConfig, respuestasAutomaticas]);

  // Función para activar/desactivar el bot
  const toggleBot = useCallback((activo: boolean) => {
    setBotConfig(prev => ({ ...prev, activo }));
    toast({
      title: activo ? 'Bot Activado' : 'Bot Desactivado',
      description: activo 
        ? 'El bot responderá automáticamente a los mensajes' 
        : 'Los mensajes serán manejados manualmente'
    });
  }, [toast]);

  // Función para actualizar configuración del bot
  const actualizarConfigBot = useCallback((nuevaConfig: Partial<BotConfig>) => {
    setBotConfig(prev => ({ ...prev, ...nuevaConfig }));
    toast({
      title: 'Configuración Actualizada',
      description: 'Los cambios se han guardado correctamente'
    });
  }, [toast]);

  // Función para agregar nueva respuesta automática
  const agregarRespuestaAutomatica = useCallback((respuesta: Omit<RespuestaAutomatica, 'id'>) => {
    const nuevaRespuesta: RespuestaAutomatica = {
      ...respuesta,
      id: Date.now().toString()
    };
    
    setRespuestasAutomaticas(prev => [...prev, nuevaRespuesta]);
    toast({
      title: 'Respuesta Agregada',
      description: 'Nueva respuesta automática creada'
    });
  }, [toast]);

  // Función para editar respuesta automática
  const editarRespuestaAutomatica = useCallback((id: string, respuesta: Partial<RespuestaAutomatica>) => {
    setRespuestasAutomaticas(prev => 
      prev.map(r => r.id === id ? { ...r, ...respuesta } : r)
    );
    toast({
      title: 'Respuesta Actualizada',
      description: 'Los cambios se han guardado correctamente'
    });
  }, [toast]);

  // Función para eliminar respuesta automática
  const eliminarRespuestaAutomatica = useCallback((id: string) => {
    setRespuestasAutomaticas(prev => prev.filter(r => r.id !== id));
    toast({
      title: 'Respuesta Eliminada',
      description: 'La respuesta automática ha sido eliminada'
    });
  }, [toast]);

  // Función para escalar conversación a humano
  const escalarAHumano = useCallback((conversacionId: string, razon: string) => {
    setConversacionesBot(prev => 
      prev.map(conv => 
        conv.id === conversacionId 
          ? { 
              ...conv, 
              estado: 'humano', 
              escaladaHumano: true, 
              razonEscalacion: razon 
            }
          : conv
      )
    );

    setEstadisticas(prev => ({
      ...prev,
      conversacionesEscaladas: prev.conversacionesEscaladas + 1
    }));

    toast({
      title: 'Conversación Escalada',
      description: 'Un agente humano se hará cargo de esta conversación'
    });
  }, [toast]);

  // Función para obtener sugerencias de mejora basadas en palabras no reconocidas
  const obtenerSugerenciasMejora = useCallback(() => {
    const palabrasFrequentes = estadisticas.palabrasClaveNoReconocidas
      .reduce((acc, palabra) => {
        acc[palabra] = (acc[palabra] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(palabrasFrequentes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([palabra, frecuencia]) => ({ palabra, frecuencia }));
  }, [estadisticas.palabrasClaveNoReconocidas]);

  // Función para generar respuesta con delay realista
  const generarRespuestaConDelay = useCallback(async (mensaje: string, clienteId: string): Promise<string | null> => {
    const respuesta = procesarMensaje(mensaje, clienteId);
    
    if (respuesta) {
      // Simular tiempo de escritura realista
      const tiempoEspera = Math.max(1000, respuesta.length * 50 + Math.random() * 1000);
      await new Promise(resolve => setTimeout(resolve, tiempoEspera));
    }
    
    return respuesta;
  }, [procesarMensaje]);

  return {
    // Estado
    botConfig,
    respuestasAutomaticas,
    conversacionesBot,
    estadisticas,
    
    // Funciones
    procesarMensaje,
    generarRespuestaConDelay,
    toggleBot,
    actualizarConfigBot,
    agregarRespuestaAutomatica,
    editarRespuestaAutomatica,
    eliminarRespuestaAutomatica,
    escalarAHumano,
    obtenerSugerenciasMejora
  };
};