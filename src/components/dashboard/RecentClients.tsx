
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  email: string;
  status: "activo" | "inactivo" | "pendiente";
  lastActivity: string;
  avatarUrl?: string;
}

const recentClients: Client[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    email: "carlos@example.com",
    status: "activo",
    lastActivity: "Hace 5 minutos",
  },
  {
    id: "2",
    name: "María López",
    email: "maria@example.com",
    status: "activo",
    lastActivity: "Hace 10 minutos",
  },
  {
    id: "3",
    name: "Juan Pérez",
    email: "juan@example.com",
    status: "pendiente",
    lastActivity: "Hace 30 minutos",
  },
  {
    id: "4",
    name: "Ana García",
    email: "ana@example.com",
    status: "inactivo",
    lastActivity: "Hace 2 horas",
  },
  {
    id: "5",
    name: "Roberto Sánchez",
    email: "roberto@example.com",
    status: "activo",
    lastActivity: "Hace 1 día",
  },
];

const statusStyles = {
  activo: "bg-green-500",
  inactivo: "bg-red-500",
  pendiente: "bg-yellow-500",
};

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function RecentClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nombre, email, estado, updated_at, avatar_url")
          .order("updated_at", { ascending: false })
          .limit(5);
        if (error) {
          console.error("Error cargando clientes recientes:", error);
          setClients([]);
        } else {
          setClients(data || []);
        }
      } catch (err) {
        console.error("Error conectando con Supabase:", err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
        <CardDescription>
          Últimos clientes activos en el gimnasio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : clients.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sin actividad reciente</div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={client.avatar_url || undefined} />
                    <AvatarFallback>
                      {String(client.nombre || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {client.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.email || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={statusStyles[(client.estado as keyof typeof statusStyles) || "pendiente"]}
                  >
                    {client.estado}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(client.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
