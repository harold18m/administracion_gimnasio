
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

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { diffDaysFromTodayLocal } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    asistenciasHoy: 0,
    clasesHoy: 0,
    ingresosHoy: 0,
    membresiasActivas: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const { count: clientesCount } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true });

        // Obtener fechas de fin para calcular membresías activas localmente (no vencidas)
        const { data: clientesFechas } = await supabase
          .from("clientes")
          .select("id, fecha_fin");
        const activosCount = (clientesFechas || []).filter((c: any) => {
          const diff = diffDaysFromTodayLocal(c.fecha_fin);
          // Si no hay fecha_fin, consideramos activa
          return diff === null || diff >= 0;
        }).length;

        const { count: asistenciasCount } = await supabase
          .from("asistencias")
          .select("*", { count: "exact", head: true })
          .gte("fecha_asistencia", start.toISOString())
          .lt("fecha_asistencia", end.toISOString());

        const { count: clasesCount } = await supabase
          .from("eventos")
          .select("*", { count: "exact", head: true })
          .eq("tipo", "clase")
          .eq("fecha", todayStr);

        const { data: eventosHoy } = await supabase
          .from("eventos")
          .select("precio, estado, fecha")
          .eq("fecha", todayStr);

        const ingresosSuma = (eventosHoy || [])
          .filter((e: any) => e.estado !== "cancelado")
          .reduce((sum: number, e: any) => sum + (e.precio ?? 0), 0);

        setStats({
          totalClientes: clientesCount || 0,
          asistenciasHoy: asistenciasCount || 0,
          clasesHoy: clasesCount || 0,
          ingresosHoy: ingresosSuma || 0,
          membresiasActivas: activosCount || 0,
        });
      } catch (error) {
        console.error("Error al cargar métricas del dashboard:", error);
      }
    };

    fetchStats();
  }, []);

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
          value={String(stats.totalClientes)} 
          icon={Users} 
          description="+12% desde el mes pasado"
          iconColor="text-gym-blue"
        />
        <StatCard 
          title="Asistencias Hoy" 
          value={String(stats.asistenciasHoy)} 
          icon={Activity} 
          description="Actualizado en tiempo real"
          iconColor="text-gym-green"
        />
        <StatCard 
          title="Clases Hoy" 
          value={String(stats.clasesHoy)} 
          icon={Calendar} 
          description="Clases programadas para hoy"
          iconColor="text-gym-purple"
        />
        <StatCard 
          title="Ingresos" 
          value={`$${stats.ingresosHoy.toLocaleString("en-US")}`} 
          icon={TrendingUp} 
          description="Ingresos estimados del día"
          iconColor="text-green-500"
        />
        <StatCard 
          title="Membresías Activas" 
          value={String(stats.membresiasActivas)} 
          icon={Dumbbell} 
          description="No vencidas; incluye por vencer"
          iconColor="text-gym-orange"
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
