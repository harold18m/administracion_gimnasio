import { WhatsAppIncomingMessage } from './WhatsAppConfig';
import { getWhatsAppAPIService } from './WhatsAppAPIService';

export interface WebhookMessage {
  from: string;
  message: string;
  timestamp: Date;
  messageId: string;
  contactName?: string;
}

export class WebhookHandler {
  private messageHandlers: Array<(message: WebhookMessage) => void> = [];
  private statusHandlers: Array<(status: any) => void> = [];

  // Registrar handler para mensajes entrantes
  onMessage(handler: (message: WebhookMessage) => void) {
    this.messageHandlers.push(handler);
  }

  // Registrar handler para estados de mensaje
  onStatus(handler: (status: any) => void) {
    this.statusHandlers.push(handler);
  }

  // Procesar webhook de WhatsApp
  async processWebhook(body: any, signature?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar que es un webhook de WhatsApp
      if (body.object !== 'whatsapp_business_account') {
        return { success: false, error: 'No es un webhook de WhatsApp Business' };
      }

      const webhookData: WhatsAppIncomingMessage = body;
      const apiService = getWhatsAppAPIService();

      // Procesar mensajes entrantes
      const messages = apiService.processIncomingMessage(webhookData);
      
      for (const msg of messages) {
        const webhookMessage: WebhookMessage = {
          from: msg.from,
          message: msg.message,
          timestamp: msg.timestamp,
          messageId: msg.messageId
        };

        // Obtener nombre del contacto si está disponible
        webhookData.entry.forEach(entry => {
          entry.changes.forEach(change => {
            if (change.value.contacts) {
              const contact = change.value.contacts.find(c => c.wa_id === msg.from);
              if (contact) {
                webhookMessage.contactName = contact.profile.name;
              }
            }
          });
        });

        // Notificar a todos los handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(webhookMessage);
          } catch (error) {
            console.error('Error en message handler:', error);
          }
        });
      }

      // Procesar estados de mensaje
      webhookData.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.value.statuses) {
            change.value.statuses.forEach(status => {
              this.statusHandlers.forEach(handler => {
                try {
                  handler(status);
                } catch (error) {
                  console.error('Error en status handler:', error);
                }
              });
            });
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Verificar webhook (para configuración inicial)
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const apiService = getWhatsAppAPIService();
    
    if (mode === 'subscribe' && apiService.verifyWebhookToken(token)) {
      return challenge;
    }
    
    return null;
  }

  // Remover handlers
  removeMessageHandler(handler: (message: WebhookMessage) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  removeStatusHandler(handler: (status: any) => void) {
    const index = this.statusHandlers.indexOf(handler);
    if (index > -1) {
      this.statusHandlers.splice(index, 1);
    }
  }
}

// Instancia singleton del webhook handler
let webhookHandler: WebhookHandler | null = null;

export const getWebhookHandler = (): WebhookHandler => {
  if (!webhookHandler) {
    webhookHandler = new WebhookHandler();
  }
  return webhookHandler;
};

// Configuración para servidor Express (ejemplo)
export const createWebhookEndpoints = () => {
  const handler = getWebhookHandler();

  return {
    // GET /webhook - Verificación del webhook
    verify: (req: any, res: any) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const result = handler.verifyWebhook(mode, token, challenge);
      
      if (result) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Forbidden');
      }
    },

    // POST /webhook - Recibir mensajes
    receive: async (req: any, res: any) => {
      const signature = req.headers['x-hub-signature-256'];
      const result = await handler.processWebhook(req.body, signature);

      if (result.success) {
        res.status(200).send('OK');
      } else {
        res.status(400).send(result.error);
      }
    }
  };
};