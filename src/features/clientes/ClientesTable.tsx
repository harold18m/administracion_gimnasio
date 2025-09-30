
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Edit, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { Cliente } from "./types";
import { useMembershipExpiration } from "@/hooks/useMembershipExpiration";

interface ClientesTableProps {
  clientes: Cliente[];
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

export function ClientesTable({
  clientes,
  busqueda,
  onBusquedaChange,
  onEdit,
  onDelete,
}: ClientesTableProps) {
  const { getMembershipStatus, getStatusColor, getStatusText } = useMembershipExpiration();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Registrados</CardTitle>
        <CardDescription>
          Administra los datos de los clientes del gimnasio
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Fecha Nacimiento</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => {
                const status = getMembershipStatus(cliente.fecha_fin);
                return (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {cliente.nombre.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{cliente.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.dni || 'Sin DNI'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{cliente.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.telefono}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cliente.fecha_nacimiento ? 
                      new Date(cliente.fecha_nacimiento).toLocaleDateString() : 
                      'No especificada'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {cliente.membresia_id ? 'Con membresía' : 'Sin membresía'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={status === 'active' ? 'default' : status === 'expiring' ? 'destructive' : 'secondary'}
                        className={`${getStatusColor(status)} flex items-center space-x-1`}
                      >
                        {status === 'expiring' && <AlertTriangle className="h-3 w-3" />}
                        {status === 'active' && <Calendar className="h-3 w-3" />}
                        <span>{getStatusText(status)}</span>
                      </Badge>
                      {cliente.fecha_fin && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(cliente.fecha_fin).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
