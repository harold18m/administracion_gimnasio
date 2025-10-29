import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { useMembershipExpiration } from "@/hooks/useMembershipExpiration";
import { useClientes } from "@/features/clientes/useClientes";

export function ExpiringMemberships() {
  const { clientes } = useClientes();
  const { getMembershipStatus, getStatusColor, getStatusText } = useMembershipExpiration();

  // Calcular días restantes localmente (sin RPC)
  const calcDaysRemaining = (fechaFin: string | null): number | null => {
    if (!fechaFin) return null;
    const today = new Date();
    const endDate = new Date(fechaFin);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const diffTime = startOfEnd.getTime() - startOfToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Mostrar solo clientes con membresías por vencer (<= 7 días)
  const expiringClients = clientes.filter(cliente => {
    if (!cliente.fecha_fin) return false;
    const status = getMembershipStatus(cliente.fecha_fin);
    return status === 'por_vencer';
  }).slice(0, 5); // Mostrar solo los primeros 5

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span>Membresías por Vencer</span>
        </CardTitle>
        <CardDescription>
          Clientes con membresías que vencen pronto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expiringClients.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay membresías próximas a vencer
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {expiringClients.map((cliente) => {
              const status = getMembershipStatus(cliente.fecha_fin);
              const fechaFinStr = cliente.fecha_fin instanceof Date
                ? cliente.fecha_fin.toISOString()
                : cliente.fecha_fin;
              const daysRemaining = calcDaysRemaining(fechaFinStr);

              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between space-x-4 p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {cliente.nombre.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {cliente.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {new Date(cliente.fecha_fin!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={status === 'por_vencer' ? 'destructive' : 'secondary'}
                      className={`${getStatusColor(status)} text-xs`}
                    >
                      {daysRemaining !== null && daysRemaining >= 0
                        ? `${daysRemaining} días`
                        : getStatusText(status)
                      }
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Renovar membresía"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}