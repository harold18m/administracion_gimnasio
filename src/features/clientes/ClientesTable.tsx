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
import type { clientes } from "@prisma/client";
import { useMembershipExpiration } from "@/hooks/useMembershipExpiration";

interface ClientesTableProps {
  clientes: clientes[];
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  onEdit: (cliente: clientes) => void;
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
        {/* Vista de tabla para pantallas grandes */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Fecha Nacimiento</TableHead>
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
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={status === 'activa' ? 'default' : status === 'por_vencer' ? 'destructive' : 'secondary'}
                            className={`${getStatusColor(status)} flex items-center space-x-1`}
                          >
                            {status === 'por_vencer' && <AlertTriangle className="h-3 w-3" />}
                            {status === 'activa' && <Calendar className="h-3 w-3" />}
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Vista de tarjetas para pantallas pequeñas */}
        <div className="md:hidden space-y-4">
          {clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clientes
            </div>
          ) : (
            clientes.map((cliente) => {
              const status = getMembershipStatus(cliente.fecha_fin);
              return (
                <Card key={cliente.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {cliente.nombre.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{cliente.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {cliente.dni || 'Sin DNI'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email:</p>
                      <p className="break-all">{cliente.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teléfono:</p>
                      <p>{cliente.telefono}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha Nacimiento:</p>
                      <p>
                        {cliente.fecha_nacimiento ?
                          new Date(cliente.fecha_nacimiento).toLocaleDateString() :
                          'No especificada'
                        }
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="default" className="text-xs">
                        {cliente.membresia_id ? 'Con membresía' : 'Sin membresía'}
                      </Badge>
                      <Badge
                        variant={status === 'activa' ? 'default' : status === 'por_vencer' ? 'destructive' : 'secondary'}
                        className={`${getStatusColor(status)} flex items-center space-x-1 text-xs`}
                      >
                        {status === 'por_vencer' && <AlertTriangle className="h-3 w-3" />}
                        {status === 'activa' && <Calendar className="h-3 w-3" />}
                        <span>{getStatusText(status)}</span>
                      </Badge>
                    </div>
                    {cliente.fecha_fin && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(cliente.fecha_fin).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
