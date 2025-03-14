
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Edit, Trash2 } from "lucide-react";
import { Cliente, estadoStyle } from "./types";

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
            placeholder="Buscar por nombre, DNI o email..."
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
              <TableHead>DNI</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Asistencias</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={cliente.avatarUrl} />
                        <AvatarFallback>
                          {cliente.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{cliente.nombre}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{cliente.dni}</TableCell>
                  <TableCell>
                    <div>
                      <p>{cliente.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.telefono}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoStyle[cliente.membresia]}>
                      {cliente.membresia}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        Inicio: {new Date(cliente.fechaInicio).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Fin: {new Date(cliente.fechaFin).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{cliente.asistencias}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
