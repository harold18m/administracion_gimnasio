"use client";
import {
  Activity,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { PaymentStatusPanel } from "@/components/dashboard/PaymentStatusPanel";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    asistenciasHoy: 0,
    clasesHoy: 0,
    ingresosHoy: 0,
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
      </div>

      <div className="w-full">
        <ActivityChart />
      </div>
      <div className="lg:col-span-3">
        <PaymentStatusPanel />
      </div>
    </div>
  );
}