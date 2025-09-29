// Configuración para WhatsApp Business API
export interface WhatsAppAPIConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  webhookUrl: string;
  phoneNumber: string; // Tu número de WhatsApp (formato: +1234567890)
}

// Configuración por defecto (debes completar con tus datos reales)
export const defaultWhatsAppConfig: WhatsAppAPIConfig = {
  phoneNumberId: '', // ID del número de teléfono de WhatsApp Business
  accessToken: '', // Token de acceso de la aplicación de Facebook
  webhookVerifyToken: '', // Token para verificar el webhook
  businessAccountId: '', // ID de la cuenta de WhatsApp Business
  appId: '', // ID de la aplicación de Facebook
  appSecret: '', // Secreto de la aplicación de Facebook
  webhookUrl: '', // URL donde recibirás los webhooks
  phoneNumber: '', // Tu número de WhatsApp con código de país
};

// URLs de la API de WhatsApp
export const WHATSAPP_API_URLS = {
  BASE_URL: 'https://graph.facebook.com/v18.0',
  SEND_MESSAGE: (phoneNumberId: string) => 
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
  MEDIA_UPLOAD: (phoneNumberId: string) => 
    `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
  WEBHOOK_VERIFICATION: '/webhook',
};

// Tipos de mensajes soportados por WhatsApp API
export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';

// Estructura de mensaje para enviar a WhatsApp API
export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: WhatsAppMessageType;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

// Estructura de mensaje recibido desde WhatsApp API
export interface WhatsAppIncomingMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Estados de configuración
export enum ConfigurationStatus {
  NOT_CONFIGURED = 'not_configured',
  CONFIGURING = 'configuring',
  CONFIGURED = 'configured',
  ERROR = 'error'
}

export interface WhatsAppConnectionStatus {
  status: ConfigurationStatus;
  lastCheck: Date;
  error?: string;
  phoneNumber?: string;
  isConnected: boolean;
}