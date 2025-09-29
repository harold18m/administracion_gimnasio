import { 
  WhatsAppAPIConfig, 
  WhatsAppMessage, 
  WhatsAppIncomingMessage,
  WhatsAppConnectionStatus,
  ConfigurationStatus,
  WHATSAPP_API_URLS 
} from './WhatsAppConfig';

export class WhatsAppAPIService {
  private config: WhatsAppAPIConfig;
  private connectionStatus: WhatsAppConnectionStatus;

  constructor(config: WhatsAppAPIConfig) {
    this.config = config;
    this.connectionStatus = {
      status: ConfigurationStatus.NOT_CONFIGURED,
      lastCheck: new Date(),
      isConnected: false
    };
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<WhatsAppAPIConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.connectionStatus.status = ConfigurationStatus.CONFIGURING;
  }

  // Verificar conexión con WhatsApp API
  async verifyConnection(): Promise<WhatsAppConnectionStatus> {
    try {
      if (!this.config.accessToken || !this.config.phoneNumberId) {
        throw new Error('Token de acceso o ID del número de teléfono no configurados');
      }

      const response = await fetch(
        `${WHATSAPP_API_URLS.BASE_URL}/${this.config.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.connectionStatus = {
          status: ConfigurationStatus.CONFIGURED,
          lastCheck: new Date(),
          isConnected: true,
          phoneNumber: data.display_phone_number || this.config.phoneNumber
        };
      } else {
        throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.connectionStatus = {
        status: ConfigurationStatus.ERROR,
        lastCheck: new Date(),
        isConnected: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    return this.connectionStatus;
  }

  // Enviar mensaje de texto
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      if (!this.connectionStatus.isConnected) {
        await this.verifyConnection();
      }

      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''), // Limpiar número de teléfono
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(
        WHATSAPP_API_URLS.SEND_MESSAGE(this.config.phoneNumberId),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(whatsappMessage)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error enviando mensaje:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en sendTextMessage:', error);
      return false;
    }
  }

  // Enviar mensaje con plantilla
  async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'es'): Promise<boolean> {
    try {
      if (!this.connectionStatus.isConnected) {
        await this.verifyConnection();
      }

      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      const response = await fetch(
        WHATSAPP_API_URLS.SEND_MESSAGE(this.config.phoneNumberId),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(whatsappMessage)
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error en sendTemplateMessage:', error);
      return false;
    }
  }

  // Procesar mensaje entrante desde webhook
  processIncomingMessage(webhookData: WhatsAppIncomingMessage): Array<{
    from: string;
    message: string;
    timestamp: Date;
    messageId: string;
  }> {
    const messages: Array<{
      from: string;
      message: string;
      timestamp: Date;
      messageId: string;
    }> = [];

    webhookData.entry.forEach(entry => {
      entry.changes.forEach(change => {
        if (change.value.messages) {
          change.value.messages.forEach(msg => {
            if (msg.text) {
              messages.push({
                from: msg.from,
                message: msg.text.body,
                timestamp: new Date(parseInt(msg.timestamp) * 1000),
                messageId: msg.id
              });
            }
          });
        }
      });
    });

    return messages;
  }

  // Verificar webhook token
  verifyWebhookToken(token: string): boolean {
    return token === this.config.webhookVerifyToken;
  }

  // Obtener estado de conexión
  getConnectionStatus(): WhatsAppConnectionStatus {
    return this.connectionStatus;
  }

  // Formatear número de teléfono para WhatsApp
  formatPhoneNumber(phoneNumber: string): string {
    // Remover todos los caracteres no numéricos
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    
    // Si no empieza con código de país, asumir México (+52)
    if (!cleaned.startsWith('52') && cleaned.length === 10) {
      cleaned = '52' + cleaned;
    }
    
    return cleaned;
  }

  // Validar configuración
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.phoneNumberId) {
      errors.push('ID del número de teléfono es requerido');
    }

    if (!this.config.accessToken) {
      errors.push('Token de acceso es requerido');
    }

    if (!this.config.webhookVerifyToken) {
      errors.push('Token de verificación del webhook es requerido');
    }

    if (!this.config.phoneNumber) {
      errors.push('Número de teléfono es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Instancia singleton del servicio
let whatsappAPIService: WhatsAppAPIService | null = null;

export const getWhatsAppAPIService = (config?: WhatsAppAPIConfig): WhatsAppAPIService => {
  if (!whatsappAPIService && config) {
    whatsappAPIService = new WhatsAppAPIService(config);
  }
  return whatsappAPIService!;
};

export const initializeWhatsAppAPI = (config: WhatsAppAPIConfig): WhatsAppAPIService => {
  whatsappAPIService = new WhatsAppAPIService(config);
  return whatsappAPIService;
};