import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppSetupPanel } from "@/features/whatsapp/WhatsAppSetupPanel";
import { Settings, MessageSquare, Users, Dumbbell } from "lucide-react";

const Configuracion = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Configura todos los aspectos de tu gimnasio
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="ejercicios" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Ejercicios
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de WhatsApp Business</CardTitle>
              <CardDescription>
                Configura la integración con WhatsApp Business API para automatizar las comunicaciones con tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppSetupPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Clientes</CardTitle>
              <CardDescription>
                Personaliza la gestión de clientes y membresías
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuración de clientes próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ejercicios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Ejercicios</CardTitle>
              <CardDescription>
                Gestiona rutinas, ejercicios y planes de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuración de ejercicios próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configuraciones generales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuración general próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracion;