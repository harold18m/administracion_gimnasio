import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Key, 
  Webhook, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  WhatsAppAPIConfig, 
  defaultWhatsAppConfig,
  ConfigurationStatus,
  WhatsAppConnectionStatus 
} from './WhatsAppConfig';
import { getWhatsAppAPIService, initializeWhatsAppAPI } from './WhatsAppAPIService';

interface WhatsAppSetupPanelProps {
  onConfigurationComplete?: (config: WhatsAppAPIConfig) => void;
}

export const WhatsAppSetupPanel: React.FC<WhatsAppSetupPanelProps> = ({
  onConfigurationComplete
}) => {
  const [config, setConfig] = useState<WhatsAppAPIConfig>(defaultWhatsAppConfig);
  const [connectionStatus, setConnectionStatus] = useState<WhatsAppConnectionStatus>({
    status: ConfigurationStatus.NOT_CONFIGURED,
    lastCheck: new Date(),
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    const savedConfig = localStorage.getItem('whatsapp_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultWhatsAppConfig, ...parsedConfig });
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }
  }, []);

  // Actualizar campo de configuración
  const updateConfig = (field: keyof WhatsAppAPIConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  // Guardar configuración
  const saveConfiguration = () => {
    localStorage.setItem('whatsapp_config', JSON.stringify(config));
  };

  // Probar conexión
  const testConnection = async () => {
    setIsLoading(true);
    setErrors([]);

    try {
      // Validar configuración
      const apiService = initializeWhatsAppAPI(config);
      const validation = apiService.validateConfiguration();

      if (!validation.isValid) {
        setErrors(validation.errors);
        setConnectionStatus({
          status: ConfigurationStatus.ERROR,
          lastCheck: new Date(),
          isConnected: false,
          error: validation.errors.join(', ')
        });
        return;
      }

      // Probar conexión
      const status = await apiService.verifyConnection();
      setConnectionStatus(status);

      if (status.isConnected) {
        saveConfiguration();
        onConfigurationComplete?.(config);
      }
    } catch (error) {
      setConnectionStatus({
        status: ConfigurationStatus.ERROR,
        lastCheck: new Date(),
        isConnected: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Generar URL del webhook
  const getWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/whatsapp/webhook`;
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case ConfigurationStatus.CONFIGURED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ConfigurationStatus.ERROR:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case ConfigurationStatus.CONFIGURING:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case ConfigurationStatus.CONFIGURED:
        return 'Conectado';
      case ConfigurationStatus.ERROR:
        return 'Error';
      case ConfigurationStatus.CONFIGURING:
        return 'Configurando...';
      default:
        return 'No configurado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Estado de WhatsApp Business API
          </CardTitle>
          <CardDescription>
            {connectionStatus.phoneNumber && (
              <span>Número conectado: {connectionStatus.phoneNumber}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus.isConnected ? 'default' : 'secondary'}>
                {getStatusText()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Última verificación: {connectionStatus.lastCheck.toLocaleTimeString()}
              </span>
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                'Probar Conexión'
              )}
            </Button>
          </div>
          
          {connectionStatus.error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionStatus.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuración */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Configuración Básica</TabsTrigger>
          <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información del Número
              </CardTitle>
              <CardDescription>
                Configura tu número de WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Número de WhatsApp</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+52 55 1234 5678"
                    value={config.phoneNumber}
                    onChange={(e) => updateConfig('phoneNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId">ID del Número</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="123456789012345"
                    value={config.phoneNumberId}
                    onChange={(e) => updateConfig('phoneNumberId', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessToken">Token de Acceso</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxxxxx..."
                  value={config.accessToken}
                  onChange={(e) => updateConfig('accessToken', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
              <CardDescription>
                Configuración adicional para WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessAccountId">ID de Cuenta de Negocio</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="123456789012345"
                    value={config.businessAccountId}
                    onChange={(e) => updateConfig('businessAccountId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appId">ID de Aplicación</Label>
                  <Input
                    id="appId"
                    placeholder="123456789012345"
                    value={config.appId}
                    onChange={(e) => updateConfig('appId', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appSecret">Secreto de Aplicación</Label>
                <Input
                  id="appSecret"
                  type="password"
                  placeholder="xxxxxxxxxxxxxxxx"
                  value={config.appSecret}
                  onChange={(e) => updateConfig('appSecret', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configuración de Webhook
              </CardTitle>
              <CardDescription>
                Configura el webhook para recibir mensajes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL del Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhookUrl"
                    value={getWebhookUrl()}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getWebhookUrl())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookVerifyToken">Token de Verificación</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhookVerifyToken"
                    placeholder="mi_token_secreto_123"
                    value={config.webhookVerifyToken}
                    onChange={(e) => updateConfig('webhookVerifyToken', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateConfig('webhookVerifyToken', Math.random().toString(36).substring(2, 15))}
                  >
                    Generar
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Copia esta URL y token en la configuración de webhook de tu aplicación de Facebook.
                  <br />
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
                  >
                    Ir a Facebook Developers <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Errores */}
      {errors.length > 0 && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button onClick={testConnection} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            'Guardar y Conectar'
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setConfig(defaultWhatsAppConfig)}
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
};