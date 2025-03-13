
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

export function RecentClients() {
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
          {recentClients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between space-x-4"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={client.avatarUrl} />
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {client.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className={statusStyles[client.status]}
                >
                  {client.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {client.lastActivity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
