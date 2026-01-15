import {
  Activity,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MembershipChart } from "@/components/dashboard/MembershipChart";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { startOfMonth, subMonths } from "date-fns";

// Tipo para las estadísticas del dashboard
interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  asistenciasHoy: number;
  aforoActual: number;
  ingresosMes: number;
  retencion: number;
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
    ingresosMes: 0,
    retencion: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        const startOfCurrentMonth = startOfMonth(today).toISOString();

        // Total clientes
        const { count: totalClientes } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true });

        // Clientes activos (con membresía activa)
        const { count: clientesActivos } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activa")
          .gte("fecha_fin", todayISO);

        // Asistencias de hoy
        const { count: asistenciasHoy } = await supabase
          .from("asistencias")
          .select("*", { count: "exact", head: true })
          .gte("fecha_asistencia", todayISO);

        // Aforo actual (asistencias de las últimas 3 horas como aproximación)
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
        const { count: aforoActual } = await supabase
          .from("asistencias")
          .select("*", { count: "exact", head: true })
          .gte("fecha_asistencia", threeHoursAgo.toISOString())
          .is("hora_salida", null); // Asumiendo que hay hora_salida, sino usar lógica de tiempo

        // Ingresos del Mes Actual
        const { data: ingresosData } = await supabase
          .from("transacciones")
          .select("monto")
          .gte("fecha_transaccion", startOfCurrentMonth);

        const ingresosMes = ingresosData?.reduce((acc, curr) => acc + Number(curr.monto), 0) || 0;

        // Tasa de Retención (Clientes activos / Total clientes) * 100
        const retencion = totalClientes ? Math.round((clientesActivos || 0) / totalClientes * 100) : 0;

        setStats({
          totalClientes: totalClientes || 0,
          clientesActivos: clientesActivos || 0,
          asistenciasHoy: asistenciasHoy || 0,
          aforoActual: aforoActual || 0,
          ingresosMes,
          retencion,
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
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estado de Membresías
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {paymentStatus.clientesAlDia}
              </p>
              <p className="text-xs text-muted-foreground">Al día</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentStatus.clientesPorVencer}
              </p>
              <p className="text-xs text-muted-foreground">Por vencer</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">
                {paymentStatus.clientesVencidos}
              </p>
              <p className="text-xs text-muted-foreground">Vencidos</p>
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
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-sm">{cliente.nombre}</span>
                  <Badge
                    variant={
                      cliente.dias_restantes <= 3 ? "destructive" : "secondary"
                    }
                    className="text-xs"
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
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 h-32"></Card>
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
          Resumen de actividad y métricas clave
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos (Mes)"
          value={`S/ ${stats.ingresosMes.toLocaleString("es-PE")}`}
          icon={DollarSign}
          description="Ingresos acumulados este mes"
          iconColor="text-green-500"
        />
        <StatCard
          title="Clientes Totales"
          value={String(stats.totalClientes)}
          icon={Users}
          description={`${stats.clientesActivos} activos (${stats.retencion}% tasa)`}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Asistencias Hoy"
          value={String(stats.asistenciasHoy)}
          icon={Activity}
          description="Visitas registradas hoy"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Membresías Activas"
          value={String(stats.clientesActivos)}
          icon={UserCheck}
          description="Clientes con acceso permitido"
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <RevenueChart />
        <MembershipChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
        <div className="md:col-span-5">
          <ActivityChart />
        </div>
        <div className="md:col-span-3">
          <PaymentStatusPanel />
        </div>
      </div>
    </div>
  );
}