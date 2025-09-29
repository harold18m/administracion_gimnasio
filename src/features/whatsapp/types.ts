export interface BotConfig {
  id: string;
  nombre: string;
  activo: boolean;
  horarioInicio: string;
  horarioFin: string;
  mensajeBienvenida: string;
  mensajeFueraHorario: string;
  mensajeNoEntendido: string;
  tiempoRespuesta: number; // en segundos
}

export interface RespuestaAutomatica {
  id: string;
  keywords: string[];
  respuesta: string;
  activa: boolean;
  categoria: 'horarios' | 'precios' | 'clases' | 'general' | 'reservas';
  prioridad: number;
}

export interface ConversacionBot {
  id: string;
  clienteId: string;
  estado: 'bot' | 'humano' | 'cerrada';
  iniciadaPor: 'cliente' | 'bot';
  fechaInicio: string;
  fechaUltimaActividad: string;
  mensajesBot: number;
  escaladaHumano: boolean;
  razonEscalacion?: string;
}

export interface MensajeBot {
  id: string;
  conversacionId: string;
  texto: string;
  tipo: 'automatico' | 'manual';
  respuestaId?: string; // ID de la respuesta automática usada
  confianza: number; // 0-100, qué tan seguro está el bot de la respuesta
  fecha: string;
}

export interface EstadisticasBot {
  mensajesEnviados: number;
  conversacionesAtendidas: number;
  conversacionesEscaladas: number;
  tiempoPromedioRespuesta: number;
  satisfaccionCliente: number;
  palabrasClaveNoReconocidas: string[];
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  membresia: 'activa' | 'vencida' | 'pendiente';
  fechaRegistro: string;
  ultimaVisita?: string;
  preferencias?: {
    tipoClases: string[];
    horarioPreferido: string;
    notificaciones: boolean;
  };
}

export const respuestasIniciales: RespuestaAutomatica[] = [
  {
    id: '1',
    keywords: ['horario', 'horarios', 'abierto', 'cerrado', 'hora'],
    respuesta: '🕐 Nuestros horarios son:\n\n📅 Lunes a Viernes: 6:00 AM - 10:00 PM\n📅 Sábados: 8:00 AM - 8:00 PM\n📅 Domingos: 9:00 AM - 6:00 PM\n\n¿En qué más puedo ayudarte?',
    activa: true,
    categoria: 'horarios',
    prioridad: 1
  },
  {
    id: '2',
    keywords: ['precio', 'precios', 'costo', 'cuanto', 'mensualidad', 'plan'],
    respuesta: '💰 Nuestros planes son:\n\n🏋️ Plan Básico: $299/mes\n🏋️ Plan Premium: $499/mes\n🏋️ Plan VIP: $699/mes\n\n¿Te gustaría conocer los detalles de algún plan específico?',
    activa: true,
    categoria: 'precios',
    prioridad: 1
  },
  {
    id: '3',
    keywords: ['clase', 'clases', 'actividad', 'actividades', 'yoga', 'pilates', 'spinning'],
    respuesta: '🏃‍♀️ Nuestras clases disponibles:\n\n• Yoga - Lun/Mié/Vie 7:00 AM\n• Pilates - Mar/Jue 6:30 PM\n• Spinning - Lun/Mié/Vie 7:00 PM\n• CrossFit - Mar/Jue/Sáb 8:00 AM\n• Zumba - Sáb/Dom 10:00 AM\n\n¿Te interesa reservar alguna clase?',
    activa: true,
    categoria: 'clases',
    prioridad: 1
  },
  {
    id: '4',
    keywords: ['reservar', 'reserva', 'agendar', 'cita', 'turno'],
    respuesta: '📅 Para reservar una clase:\n\n1️⃣ Dime qué clase te interesa\n2️⃣ Confirma el día y horario\n3️⃣ Te enviaré la confirmación\n\n¿Qué clase quieres reservar?',
    activa: true,
    categoria: 'reservas',
    prioridad: 1
  },
  {
    id: '5',
    keywords: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos'],
    respuesta: '¡Hola! 👋 Bienvenido/a a FitGym 💪\n\nSoy tu asistente virtual y estoy aquí para ayudarte con:\n• Horarios y clases\n• Precios y planes\n• Reservas\n• Información general\n\n¿En qué puedo ayudarte hoy?',
    activa: true,
    categoria: 'general',
    prioridad: 2
  }
];

export const botConfigInicial: BotConfig = {
  id: '1',
  nombre: 'FitBot',
  activo: true,
  horarioInicio: '06:00',
  horarioFin: '22:00',
  mensajeBienvenida: '¡Hola! 👋 Soy FitBot, tu asistente virtual de FitGym. ¿En qué puedo ayudarte?',
  mensajeFueraHorario: '🌙 Gracias por contactarnos. Nuestro horario de atención es de 6:00 AM a 10:00 PM. Te responderemos en cuanto abramos. ¡Que tengas una excelente noche!',
  mensajeNoEntendido: '🤔 Disculpa, no entendí tu mensaje. ¿Podrías reformularlo? También puedes escribir "ayuda" para ver las opciones disponibles.',
  tiempoRespuesta: 2
};