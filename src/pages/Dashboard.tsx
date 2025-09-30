
import { 
  Activity, 
  Users, 
  Calendar, 
  Dumbbell, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { UpcomingClasses } from "@/components/dashboard/UpcomingClasses";
import { ExpiringMemberships } from "@/components/dashboard/ExpiringMemberships";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen de actividad del gimnasio
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Clientes Totales" 
          value="358" 
          icon={Users} 
          description="+12% desde el mes pasado"
          iconColor="text-gym-blue"
        />
        <StatCard 
          title="Asistencias Hoy" 
          value="67" 
          icon={Activity} 
          description="15 más que ayer"
          iconColor="text-gym-green"
        />
        <StatCard 
          title="Clases Hoy" 
          value="8" 
          icon={Calendar} 
          description="2 clases pendientes"
          iconColor="text-gym-purple"
        />
        <StatCard 
          title="Ingresos" 
          value="$12,500" 
          icon={TrendingUp} 
          description="+5% desde la semana pasada"
          iconColor="text-green-500"
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <ActivityChart />
        <ExpiringMemberships />
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <UpcomingClasses />
        <RecentClients />
        <Card className="col-span-3 lg:col-span-3">
          <CardHeader>
            <CardTitle>Mensajes WhatsApp</CardTitle>
            <CardDescription>Mensajes recientes de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={message.avatarUrl} />
                    <AvatarFallback>
                      {message.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{message.name}</p>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const messages = [
  {
    id: "1",
    name: "Laura Martínez",
    message: "¿A qué hora es la clase de pilates hoy?",
    time: "Hace 5 min",
    avatarUrl: "",
  },
  {
    id: "2",
    name: "Miguel Ángel",
    message: "Necesito cambiar mi cita de entrenamiento personal",
    time: "Hace 20 min",
    avatarUrl: "",
  },
  {
    id: "3",
    name: "Sofía Ruiz",
    message: "¿Tienen algún plan para principiantes?",
    time: "Hace 45 min",
    avatarUrl: "",
  },
  {
    id: "4",
    name: "Javier López",
    message: "¿Puedo reservar una sesión para mañana?",
    time: "Hace 1 hora",
    avatarUrl: "",
  },
];
