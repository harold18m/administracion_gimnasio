import { useClientAuth } from "@/hooks/useClientAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Calendar, HelpCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { ClientCalendarWidget } from "./components/ClientCalendarWidget";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function ClientHome() {
  const { cliente, user, loading } = useClientAuth();

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      steps: [
        { 
          element: '#help-btn', 
          popover: { 
            title: 'Bienvenido a FitGym', 
            description: 'Usa este botón cuando tengas dudas sobre cómo usar la aplicación.' 
          } 
        },
        { 
          element: '#section-qr', 
          popover: { 
            title: 'Tu Llave de Acceso', 
            description: 'Toca aquí para mostrar tu código QR en la entrada del gimnasio.' 
          } 
        },
        { 
          element: '#section-calendar', 
          popover: { 
            title: 'Clases Grupales', 
            description: 'Consulta el horario de clases y planifica tu semana desde aquí.' 
          } 
        },
        { 
          element: '#nav-rutina', 
          popover: { 
            title: 'Tu Entrenamiento', 
            description: 'Aquí encontrarás tus rutinas personalizadas y podrás registrar tus ejercicios.' 
          } 
        },
        { 
          element: '#nav-pagos', 
          popover: { 
            title: 'Membresía y Pagos', 
            description: 'Revisa el estado de tu plan y realiza pagos de forma segura.' 
          } 
        },
        { 
          element: '#nav-perfil', 
          popover: { 
            title: 'Tu Perfil', 
            description: 'Gestiona tus datos personales y cierra sesión aquí.' 
          } 
        },
      ]
    });

    driverObj.drive();
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Cargando tu información...</div>;
  }

  // Caso: Usuario logueado pero email no coincide con ningún cliente en la BD
  if (!cliente) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold">Hola, {user?.email}</h1>
             <Button variant="ghost" size="icon" onClick={startTour} id="help-btn">
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
             </Button>
        </div>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Cuenta no vinculada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu correo no está registrado como cliente en el gimnasio. 
              Por favor, acércate a recepción para vincular tu cuenta o corregir tu correo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cálculos de membresía
  const diasRestantes = cliente.fecha_fin ? differenceInDays(new Date(cliente.fecha_fin), new Date()) : 0;
  const esActivo = cliente.estado === 'activa';
  
  return (
    <div className="p-4 space-y-6 max-w-md mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Hola, {cliente.nombre.split(' ')[0]}</h1>
            <p className="text-muted-foreground font-medium">¡A entrenar!</p>
        </div>
        <Button variant="ghost" size="icon" onClick={startTour} id="help-btn" className="mt-1 h-12 w-12">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
        </Button>
      </div>

      {/* Membership Card */}
      <Card className={`border-l-4 shadow-md ${esActivo ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu Membresía</CardDescription>
              <CardTitle className="text-xl mt-1">{cliente.nombre_membresia || "Sin Membresía"}</CardTitle>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              esActivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {esActivo ? "ACTIVA" : "VENCIDA"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Vence: <b>{cliente.fecha_fin ? format(new Date(cliente.fecha_fin), "dd 'de' MMMM", { locale: es }) : "N/A"}</b></span>
          </div>
          <p className="text-xs text-muted-foreground">
            {esActivo 
              ? `Te quedan ${diasRestantes} días de entrenamiento.`
              : "Renueva tu plan para continuar entrenando."}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-3" id="section-qr">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-16 text-lg bg-foreground hover:bg-foreground/90 shadow-xl transition-all active:scale-[0.98]">
              <QrCode className="mr-3 h-6 w-6" />
              Mi Código Acceso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm flex flex-col items-center justify-center text-center">
            <DialogHeader>
              <DialogTitle>Tu Código QR</DialogTitle>
              <DialogDescription>Muestra este código en el ingreso</DialogDescription>
            </DialogHeader>
            <div className="p-6 bg-white rounded-xl shadow-inner border my-4">
              {cliente.codigo_qr ? (
                <QRCode value={cliente.codigo_qr} size={200} />
              ) : (
                <p className="text-sm text-muted-foreground py-10">Sin código QR asignado</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Brillo al máximo recomendado</p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly Class Calendar */}
      <div className="pt-2" id="section-calendar">
        <ClientCalendarWidget />
      </div>

      <div className="fixed bottom-10 right-4 w-40 z-0 pointer-events-none opacity-100 filter drop-shadow-lg">
          <img 
              src="/images/erizo_inicio.webp" 
              alt="Erizo Saludo" 
              className="w-full h-auto"
          />
      </div>
    </div>
  );
}
