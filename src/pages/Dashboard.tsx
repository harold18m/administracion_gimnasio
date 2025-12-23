import {
  Activity,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

// Tipo para las estadísticas del dashboard
interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  asistenciasHoy: number;
  aforoActual: number;
  clasesHoy: number;
  ingresosHoy: number;
}

// Tipo para el estado de pagos
interface PaymentStatus {
  clientesAlDia: number;
  clientesPorVencer: number;
  clientesVencidos: number;
  proximosVencimientos: {
    id: string;
    nombre: string;
    fecha_fin: string;
    dias_restantes: number;
  }[];
}

// Hook para obtener estadísticas del dashboard
function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    clientesActivos: 0,
    asistenciasHoy: 0,
    aforoActual: 0,
    clasesHoy: 0,
    ingresosHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Total clientes
        const { count: totalClientes } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true });

        // Clientes activos (con membresía activa)
        const { count: clientesActivos } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activa");

        // Asistencias de hoy
        const { count: asistenciasHoy } = await supabase
          .from("asistencias")
          .select("*", { count: "exact", head: true })
          .gte("fecha_asistencia", todayISO);

        // Aforo actual (asistencias de las últimas 4 horas como aproximación)
        const fourHoursAgo = new Date();
        fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
        const { count: aforoActual } = await supabase
          .from("asistencias")
          .select("*", { count: "exact", head: true })
          .gte("fecha_asistencia", fourHoursAgo.toISOString());

        // Clases hoy (placeholder - ajustar según tu estructura de datos)
        const clasesHoy = 0; // TODO: Implementar cuando tengas tabla de clases

        // Ingresos estimados del día (clientes que renovaron hoy)
        const { data: membresiasPrecio } = await supabase
          .from("membresias")
          .select("id, precio");

        const { data: clientesRenovadosHoy } = await supabase
          .from("clientes")
          .select("membresia_id")
          .gte("fecha_inicio", todayISO);

        let ingresosHoy = 0;
        if (clientesRenovadosHoy && membresiasPrecio) {
          const precioMap = new Map(
            membresiasPrecio.map((m) => [m.id, m.precio])
          );
          ingresosHoy = clientesRenovadosHoy.reduce((acc, cliente) => {
            return acc + (precioMap.get(cliente.membresia_id || "") || 0);
          }, 0);
        }

        setStats({
          totalClientes: totalClientes || 0,
          clientesActivos: clientesActivos || 0,
          asistenciasHoy: asistenciasHoy || 0,
          aforoActual: aforoActual || 0,
          clasesHoy,
          ingresosHoy,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}

// Hook para obtener estado de pagos
function usePaymentStatus() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    clientesAlDia: 0,
    clientesPorVencer: 0,
    clientesVencidos: 0,
    proximosVencimientos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const today = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        // Clientes al día (membresía activa con más de 7 días restantes)
        const { count: clientesAlDia } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activa")
          .gt("fecha_fin", sevenDaysLater.toISOString());

        // Clientes por vencer (próximos 7 días)
        const { data: porVencer, count: clientesPorVencer } = await supabase
          .from("clientes")
          .select("id, nombre, fecha_fin", { count: "exact" })
          .eq("estado", "activa")
          .lte("fecha_fin", sevenDaysLater.toISOString())
          .gte("fecha_fin", today.toISOString())
          .order("fecha_fin", { ascending: true })
          .limit(5);

        // Clientes vencidos
        const { count: clientesVencidos } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true })
          .eq("estado", "vencida");

        // Calcular días restantes para los próximos vencimientos
        const proximosVencimientos =
          porVencer?.map((cliente) => {
            const fechaFin = new Date(cliente.fecha_fin || "");
            const diasRestantes = Math.ceil(
              (fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              id: cliente.id,
              nombre: cliente.nombre,
              fecha_fin: cliente.fecha_fin || "",
              dias_restantes: diasRestantes,
            };
          }) || [];

        setPaymentStatus({
          clientesAlDia: clientesAlDia || 0,
          clientesPorVencer: clientesPorVencer || 0,
          clientesVencidos: clientesVencidos || 0,
          proximosVencimientos,
        });
      } catch (error) {
        console.error("Error fetching payment status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, []);

  return { paymentStatus, loading };
}

// Componente PaymentStatusPanel
function PaymentStatusPanel() {
  const { paymentStatus, loading } = usePaymentStatus();

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estado de Membresías
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {paymentStatus.clientesAlDia}
              </p>
              <p className="text-sm text-muted-foreground">Al día</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentStatus.clientesPorVencer}
              </p>
              <p className="text-sm text-muted-foreground">Por vencer</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">
                {paymentStatus.clientesVencidos}
              </p>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </div>
          </div>
        </div>

        {paymentStatus.proximosVencimientos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Próximos vencimientos</h4>
            <div className="space-y-2">
              {paymentStatus.proximosVencimientos.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="font-medium">{cliente.nombre}</span>
                  <Badge
                    variant={
                      cliente.dias_restantes <= 3 ? "destructive" : "secondary"
                    }
                  >
                    {cliente.dias_restantes === 0
                      ? "Hoy"
                      : cliente.dias_restantes === 1
                        ? "Mañana"
                        : `${cliente.dias_restantes} días`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen de actividad del gimnasio
          </p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-[80px] w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
          description={`${stats.clientesActivos} con membresía activa`}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Asistencias Hoy"
          value={String(stats.asistenciasHoy)}
          icon={Activity}
          description={`${stats.aforoActual} personas en el gimnasio`}
          iconColor="text-green-500"
        />
        <StatCard
          title="Clases Hoy"
          value={String(stats.clasesHoy)}
          icon={Calendar}
          description="Clases programadas para hoy"
          iconColor="text-purple-500"
        />
        <StatCard
          title="Ingresos"
          value={`S/ ${stats.ingresosHoy.toLocaleString("es-PE")}`}
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