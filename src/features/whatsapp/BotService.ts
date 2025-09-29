import { BotConfig, RespuestaAutomatica, MensajeBot, ConversacionBot, Cliente } from './types';

export class BotService {
  private config: BotConfig;
  private respuestas: RespuestaAutomatica[];
  private conversaciones: Map<string, ConversacionBot> = new Map();
  private clientes: Cliente[] = [];

  constructor(config: BotConfig, respuestas: RespuestaAutomatica[]) {
    this.config = config;
    this.respuestas = respuestas;
  }

  /**
   * Procesa un mensaje entrante y genera una respuesta automática
   */
  async procesarMensaje(
    numeroTelefono: string,
    mensaje: string,
    timestamp: Date = new Date()
  ): Promise<{ respuesta: string; requiereHumano: boolean; cliente?: Cliente }> {
    // Verificar si el bot está activo
    if (!this.config.activo) {
      return {
        respuesta: "El servicio automático no está disponible en este momento. Un agente se pondrá en contacto contigo pronto.",
        requiereHumano: true
      };
    }

    // Verificar horario de atención
    if (!this.estaEnHorarioAtencion()) {
      return {
        respuesta: this.config.mensajeFueraHorario,
        requiereHumano: false
      };
    }

    // Obtener o crear conversación
    const conversacion = this.obtenerConversacion(numeroTelefono);
    
    // Agregar mensaje a la conversación
    const mensajeBot: MensajeBot = {
      id: this.generarId(),
      contenido: mensaje,
      timestamp,
      esBot: false,
      numeroTelefono
    };
    
    conversacion.mensajes.push(mensajeBot);

    // Buscar cliente existente
    const cliente = this.buscarCliente(numeroTelefono);

    // Si es el primer mensaje, enviar bienvenida
    if (conversacion.mensajes.length === 1) {
      const mensajeBienvenida = cliente 
        ? `¡Hola ${cliente.nombre}! ${this.config.mensajeBienvenida}`
        : this.config.mensajeBienvenida;
      
      this.agregarRespuestaBot(conversacion, mensajeBienvenida);
      return {
        respuesta: mensajeBienvenida,
        requiereHumano: false,
        cliente
      };
    }

    // Buscar respuesta automática
    const respuestaEncontrada = this.buscarRespuestaAutomatica(mensaje);
    
    if (respuestaEncontrada) {
      let respuestaPersonalizada = respuestaEncontrada.respuesta;
      
      // Personalizar respuesta si hay cliente
      if (cliente) {
        respuestaPersonalizada = this.personalizarRespuesta(respuestaPersonalizada, cliente);
      }
      
      this.agregarRespuestaBot(conversacion, respuestaPersonalizada);
      
      return {
        respuesta: respuestaPersonalizada,
        requiereHumano: false,
        cliente
      };
    }

    // Si no se encontró respuesta automática
    conversacion.requiereHumano = true;
    const mensajeNoEntendido = `${this.config.mensajeNoEntendido}\n\nUn agente se pondrá en contacto contigo pronto.`;
    
    this.agregarRespuestaBot(conversacion, mensajeNoEntendido);
    
    return {
      respuesta: mensajeNoEntendido,
      requiereHumano: true,
      cliente
    };
  }

  /**
   * Busca una respuesta automática basada en las palabras clave
   */
  private buscarRespuestaAutomatica(mensaje: string): RespuestaAutomatica | null {
    const mensajeNormalizado = this.normalizarTexto(mensaje);
    const palabrasMensaje = mensajeNormalizado.split(' ');

    // Buscar respuestas activas ordenadas por prioridad
    const respuestasActivas = this.respuestas
      .filter(r => r.activa)
      .sort((a, b) => (b.prioridad || 1) - (a.prioridad || 1));

    for (const respuesta of respuestasActivas) {
      const coincidencias = respuesta.keywords.filter(keyword => {
        const keywordNormalizada = this.normalizarTexto(keyword);
        return palabrasMensaje.some(palabra => 
          palabra.includes(keywordNormalizada) || keywordNormalizada.includes(palabra)
        );
      });

      // Si encuentra al menos una coincidencia, devolver la respuesta
      if (coincidencias.length > 0) {
        return respuesta;
      }
    }

    return null;
  }

  /**
   * Personaliza una respuesta con datos del cliente
   */
  private personalizarRespuesta(respuesta: string, cliente: Cliente): string {
    return respuesta
      .replace('{nombre}', cliente.nombre)
      .replace('{telefono}', cliente.telefono)
      .replace('{email}', cliente.email || '')
      .replace('{membresia}', cliente.tipoMembresia || 'básica');
  }

  /**
   * Normaliza texto para comparación (minúsculas, sin acentos, etc.)
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, '') // Remover puntuación
      .trim();
  }

  /**
   * Verifica si está en horario de atención
   */
  private estaEnHorarioAtencion(): boolean {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
    
    const [horaInicio, minutoInicio] = this.config.horarioInicio.split(':').map(Number);
    const [horaFin, minutoFin] = this.config.horarioFin.split(':').map(Number);
    
    const horarioInicio = horaInicio * 100 + minutoInicio;
    const horarioFin = horaFin * 100 + minutoFin;
    
    return horaActual >= horarioInicio && horaActual <= horarioFin;
  }

  /**
   * Obtiene o crea una conversación
   */
  private obtenerConversacion(numeroTelefono: string): ConversacionBot {
    if (!this.conversaciones.has(numeroTelefono)) {
      const nuevaConversacion: ConversacionBot = {
        id: this.generarId(),
        numeroTelefono,
        mensajes: [],
        activa: true,
        requiereHumano: false,
        fechaInicio: new Date(),
        ultimaActividad: new Date()
      };
      this.conversaciones.set(numeroTelefono, nuevaConversacion);
    }
    
    const conversacion = this.conversaciones.get(numeroTelefono)!;
    conversacion.ultimaActividad = new Date();
    
    return conversacion;
  }

  /**
   * Agrega una respuesta del bot a la conversación
   */
  private agregarRespuestaBot(conversacion: ConversacionBot, respuesta: string): void {
    const mensajeBot: MensajeBot = {
      id: this.generarId(),
      contenido: respuesta,
      timestamp: new Date(),
      esBot: true,
      numeroTelefono: conversacion.numeroTelefono
    };
    
    conversacion.mensajes.push(mensajeBot);
  }

  /**
   * Busca un cliente por número de teléfono
   */
  private buscarCliente(numeroTelefono: string): Cliente | undefined {
    return this.clientes.find(cliente => 
      cliente.telefono === numeroTelefono || 
      cliente.telefono.replace(/\D/g, '') === numeroTelefono.replace(/\D/g, '')
    );
  }

  /**
   * Genera un ID único
   */
  private generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Actualiza la configuración del bot
   */
  actualizarConfiguracion(nuevaConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...nuevaConfig };
  }

  /**
   * Actualiza las respuestas automáticas
   */
  actualizarRespuestas(nuevasRespuestas: RespuestaAutomatica[]): void {
    this.respuestas = nuevasRespuestas;
  }

  /**
   * Actualiza la lista de clientes
   */
  actualizarClientes(clientes: Cliente[]): void {
    this.clientes = clientes;
  }

  /**
   * Obtiene estadísticas del bot
   */
  obtenerEstadisticas() {
    const conversacionesArray = Array.from(this.conversaciones.values());
    const totalMensajes = conversacionesArray.reduce(
      (total, conv) => total + conv.mensajes.length, 0
    );
    const mensajesBot = conversacionesArray.reduce(
      (total, conv) => total + conv.mensajes.filter(m => m.esBot).length, 0
    );
    const conversacionesEscaladas = conversacionesArray.filter(
      conv => conv.requiereHumano
    ).length;

    return {
      conversacionesActivas: conversacionesArray.filter(conv => conv.activa).length,
      totalConversaciones: conversacionesArray.length,
      mensajesEnviados: mensajesBot,
      mensajesRecibidos: totalMensajes - mensajesBot,
      conversacionesEscaladas,
      tiempoPromedioRespuesta: this.config.tiempoRespuesta,
      satisfaccionCliente: 85 // Esto vendría de una encuesta real
    };
  }

  /**
   * Obtiene conversaciones que requieren atención humana
   */
  obtenerConversacionesEscaladas(): ConversacionBot[] {
    return Array.from(this.conversaciones.values())
      .filter(conv => conv.requiereHumano && conv.activa);
  }

  /**
   * Marca una conversación como atendida por humano
   */
  marcarComoAtendida(numeroTelefono: string): void {
    const conversacion = this.conversaciones.get(numeroTelefono);
    if (conversacion) {
      conversacion.requiereHumano = false;
      conversacion.atendidaPorHumano = true;
    }
  }

  /**
   * Obtiene sugerencias de mejora basadas en mensajes no entendidos
   */
  obtenerSugerenciasMejora(): { palabra: string; frecuencia: number }[] {
    const palabrasNoEntendidas: Map<string, number> = new Map();
    
    Array.from(this.conversaciones.values()).forEach(conversacion => {
      conversacion.mensajes
        .filter(mensaje => !mensaje.esBot)
        .forEach(mensaje => {
          const palabras = this.normalizarTexto(mensaje.contenido).split(' ');
          palabras.forEach(palabra => {
            if (palabra.length > 3 && !this.tieneRespuestaParaPalabra(palabra)) {
              palabrasNoEntendidas.set(palabra, (palabrasNoEntendidas.get(palabra) || 0) + 1);
            }
          });
        });
    });

    return Array.from(palabrasNoEntendidas.entries())
      .map(([palabra, frecuencia]) => ({ palabra, frecuencia }))
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 10);
  }

  /**
   * Verifica si existe una respuesta para una palabra específica
   */
  private tieneRespuestaParaPalabra(palabra: string): boolean {
    return this.respuestas.some(respuesta =>
      respuesta.keywords.some(keyword =>
        this.normalizarTexto(keyword).includes(palabra)
      )
    );
  }
}