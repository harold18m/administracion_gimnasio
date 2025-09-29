# Configuración de WhatsApp Business API

Esta guía te ayudará a configurar tu bot de WhatsApp con un número real usando la API de WhatsApp Business.

## 📋 Requisitos Previos

1. **Cuenta de Facebook Business**: Necesitas una cuenta de Facebook Business activa
2. **Aplicación de Facebook**: Crear una aplicación en Facebook Developers
3. **Número de WhatsApp Business**: Un número de teléfono verificado en WhatsApp Business
4. **Servidor con HTTPS**: Para recibir webhooks (puedes usar ngrok para desarrollo)

## 🚀 Paso a Paso

### 1. Crear Aplicación en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Haz clic en "Mis Apps" → "Crear App"
3. Selecciona "Empresa" como tipo de aplicación
4. Completa la información básica:
   - Nombre de la aplicación
   - Email de contacto
   - Propósito de la aplicación

### 2. Configurar WhatsApp Business API

1. En tu aplicación, ve a "Productos" → "WhatsApp"
2. Haz clic en "Configurar" para agregar WhatsApp a tu aplicación
3. Sigue el asistente de configuración:
   - Selecciona o crea una cuenta de WhatsApp Business
   - Verifica tu número de teléfono
   - Configura el perfil de tu negocio

### 3. Obtener Credenciales

#### Token de Acceso Temporal (para pruebas)
1. En la sección "API Setup", encontrarás un token temporal
2. **⚠️ Este token expira en 24 horas**

#### Token de Acceso Permanente
1. Ve a "Configuración de la App" → "Básico"
2. Copia el "ID de la aplicación" y "Clave secreta de la aplicación"
3. Usa estos para generar un token permanente:

```bash
curl -X GET "https://graph.facebook.com/oauth/access_token?client_id=TU_APP_ID&client_secret=TU_APP_SECRET&grant_type=client_credentials"
```

#### Obtener Phone Number ID
1. En la sección "API Setup", encontrarás el "Phone number ID"
2. También puedes obtenerlo con:

```bash
curl -X GET "https://graph.facebook.com/v18.0/TU_BUSINESS_ACCOUNT_ID/phone_numbers" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

### 4. Configurar Webhook

#### 4.1 Configurar URL del Webhook
1. En tu aplicación, ve a "WhatsApp" → "Configuración"
2. En la sección "Webhook", configura:
   - **URL del webhook**: `https://tu-dominio.com/api/whatsapp/webhook`
   - **Token de verificación**: Un token secreto que tú defines
   - **Campos de suscripción**: Selecciona "messages"

#### 4.2 Para Desarrollo Local (usando ngrok)
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer tu servidor local
ngrok http 3000

# Usar la URL HTTPS que te proporciona ngrok
# Ejemplo: https://abc123.ngrok.io/api/whatsapp/webhook
```

### 5. Configurar en la Aplicación FitGym

1. Ve a la página de WhatsApp en tu aplicación
2. Haz clic en la tab "API"
3. Completa los siguientes campos:

#### Configuración Básica
- **Número de WhatsApp**: Tu número con código de país (ej: +52 55 1234 5678)
- **ID del Número**: El Phone Number ID obtenido de Facebook
- **Token de Acceso**: Tu token de acceso permanente

#### Configuración Avanzada
- **ID de Cuenta de Negocio**: Tu Business Account ID
- **ID de Aplicación**: El App ID de Facebook
- **Secreto de Aplicación**: El App Secret de Facebook

#### Webhook
- **URL del Webhook**: Se genera automáticamente
- **Token de Verificación**: Genera uno o usa el que prefieras

4. Haz clic en "Guardar y Conectar"

## 🔧 Configuración del Servidor (Backend)

Si necesitas configurar el backend para manejar webhooks, aquí tienes un ejemplo básico:

### Express.js
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Verificación del webhook
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'TU_TOKEN_DE_VERIFICACION') {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Recibir mensajes
app.post('/api/whatsapp/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    // Procesar el mensaje aquí
    console.log('Mensaje recibido:', JSON.stringify(body, null, 2));
    
    // Responder a WhatsApp que recibimos el mensaje
    res.status(200).send('OK');
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
```

## 🧪 Probar la Configuración

1. **Verificar Conexión**: En la aplicación, haz clic en "Probar Conexión"
2. **Enviar Mensaje de Prueba**: Usa la API para enviar un mensaje:

```bash
curl -X POST "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "TU_NUMERO_DE_PRUEBA",
    "type": "text",
    "text": {
      "body": "¡Hola! Este es un mensaje de prueba desde FitGym Bot 🤖"
    }
  }'
```

3. **Probar Webhook**: Envía un mensaje a tu número de WhatsApp Business y verifica que llegue al webhook

## 🔒 Seguridad

### Variables de Entorno
Nunca hardcodees las credenciales. Usa variables de entorno:

```bash
# .env
WHATSAPP_ACCESS_TOKEN=tu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id_aqui
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_token_verificacion_aqui
WHATSAPP_APP_SECRET=tu_app_secret_aqui
```

### Verificación de Firma
Para producción, verifica la firma del webhook:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## 📊 Límites y Consideraciones

### Límites de la API
- **Mensajes por día**: Depende de tu nivel de verificación
- **Plantillas**: Necesitas plantillas aprobadas para mensajes proactivos
- **Ventana de 24 horas**: Solo puedes responder dentro de 24 horas después del último mensaje del cliente

### Costos
- **Conversaciones**: Se cobran por conversación iniciada
- **Plantillas**: Pueden tener costos adicionales
- **Verificación**: El proceso de verificación puede tomar tiempo

## 🆘 Solución de Problemas

### Error: "Invalid access token"
- Verifica que el token no haya expirado
- Asegúrate de usar el token correcto para tu aplicación

### Error: "Phone number not found"
- Verifica que el Phone Number ID sea correcto
- Asegúrate de que el número esté verificado en WhatsApp Business

### Webhook no recibe mensajes
- Verifica que la URL sea accesible públicamente (HTTPS)
- Confirma que el token de verificación coincida
- Revisa los logs del servidor para errores

### Mensajes no se envían
- Verifica los permisos de la aplicación
- Asegúrate de estar dentro de la ventana de 24 horas
- Para mensajes proactivos, usa plantillas aprobadas

## 📚 Recursos Adicionales

- [Documentación oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guía de inicio rápido](https://developers.facebook.com/docs/whatsapp/getting-started)
- [Referencia de la API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Plantillas de mensajes](https://developers.facebook.com/docs/whatsapp/message-templates)

## 🎯 Próximos Pasos

Una vez configurado, podrás:
- ✅ Recibir mensajes de clientes en tiempo real
- ✅ Enviar respuestas automáticas
- ✅ Integrar con el sistema de clientes de FitGym
- ✅ Configurar horarios de atención
- ✅ Escalar conversaciones a humanos cuando sea necesario

¡Tu bot de WhatsApp estará listo para ayudar a tus clientes del gimnasio! 💪🤖