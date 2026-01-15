import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  id: string;
  cliente: {
    nombre: string;
    avatar_url: string | null;
  };
  fecha_asistencia: string;
  estado: string;
}

export function RecentActivityList() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      // Necesitamos hacer un join manual o usar la sintaxis de supabase para joins si las FK estan bien
      // Asumiendo que 'cliente_id' es FK a 'clientes.id'
      const { data, error } = await supabase
        .from('asistencias')
        .select(`
          id,
          fecha_asistencia,
          estado,
          clientes (
            nombre,
            avatar_url
          )
        `)
        .order('fecha_asistencia', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching activity:', error);
        return;
      }

      // Mapear los datos para aplanar la estructura
      const formattedData = data.map((item: any) => ({
        id: item.id,
        fecha_asistencia: item.fecha_asistencia,
        estado: item.estado,
        cliente: {
          nombre: item.clientes?.nombre || 'Desconocido',
          avatar_url: item.clientes?.avatar_url
        }
      }));

      setActivities(formattedData);
    };

    fetchActivity();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.cliente.avatar_url || ""} alt="Avatar" />
                  <AvatarFallback>{getInitials(activity.cliente.nombre)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.fecha_asistencia), "EEEE d 'de' MMMM, h:mm a", { locale: es })}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {activity.estado === 'presente' && <span className="text-green-500 text-xs">Presente</span>}
                  {activity.estado === 'tardanza' && <span className="text-yellow-500 text-xs">Tardanza</span>}
                  {activity.estado === 'ausente' && <span className="text-red-500 text-xs">Ausente</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
