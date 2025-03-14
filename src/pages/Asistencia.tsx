
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Fingerprint, 
  UserCheck, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle 
} from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  membresia: "activa" | "vencida" | "pendiente";
  avatarUrl?: string;
}

interface Asistencia {
  id: string;
  clienteId: string;
  fecha: string;
  hora: string;
  tipo: "huella" | "dni";
}

const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};

const clientesDemo: Cliente[] = [
  {
    id: "1",
    nombre: "Carlos Mendoza",
    dni: "45678912",
    email: "carlos@example.com",
    membresia: "activa",
  },
  {
    id: "2",
    nombre: "María López",
    dni: "87654321",
    email: "maria@example.com",
    membresia: "activa",
  },
  {
    id: "3",
    nombre: "Juan Pérez",
    dni: "12345678",
    email: "juan@example.com",
    membresia: "pendiente",
  },
  {
    id: "4",
    nombre: "Ana García",
    dni: "98765432",
    email: "ana@example.com",
    membresia: "vencida",
  },
  {
    id: "5",
    nombre: "Roberto Sánchez",
    dni: "56789123",
    email: "roberto@example.com",
    membresia: "activa",
  },
];

const asistenciasIniciales: Asistencia[] = [
  {
    id: "1",
    clienteId: "1",
    fecha: "2023-10-05",
    hora: "08:30:15",
    tipo: "huella",
  },
  {
    id: "2",
    clienteId: "2",
    fecha: "2023-10-05",
    hora: "09:15:42",
    tipo: "dni",
  },
  {
    id: "3",
    clienteId: "3",
    fecha: "2023-10-05",
    hora: "10:05:33",
    tipo: "huella",
  },
];

export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [asistencias, setAsistencias] = useState<Asistencia[]>(asistenciasIniciales);
  const [modoAsistencia, setModoAsistencia] = useState<"huella" | "dni">("dni");
  const { toast } = useToast();

  const registrarAsistencia = (cliente: Cliente, tipo: "huella" | "dni") => {
    if (cliente.membresia === "vencida") {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "La membresía de este cliente está vencida.",
      });
      return;
    }
    
    const now = new Date();
    const fecha = now.toISOString().split("T")[0];
    const hora = now.toTimeString().split(" ")[0];
    
    // Verificar si ya registró asistencia hoy
    const yaRegistrado = asistencias.some(
      (a) => a.clienteId === cliente.id && a.fecha === fecha
    );
    
    if (yaRegistrado) {
      toast({
        variant: "destructive",
        title: "Registro duplicado",
        description: `${cliente.nombre} ya registró su asistencia hoy.`,
      });
      return;
    }
    
    const nuevaAsistencia: Asistencia = {
      id: Math.random().toString(36).substr(2, 9),
      clienteId: cliente.id,
      fecha,
      hora,
      tipo,
    };
    
    setAsistencias([nuevaAsistencia, ...asistencias]);
    
    toast({
      title: "Asistencia registrada",
      description: `${cliente.nombre} ha registrado su asistencia a las ${hora}.`,
    });
    
    setDniInput("");
  };

  const registrarPorDNI = () => {
    if (!dniInput) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "Por favor, ingresa un DNI válido.",
      });
      return;
    }
    
    const cliente = clientesDemo.find((c) => c.dni === dniInput);
    
    if (!cliente) {
      toast({
        variant: "destructive",
        title: "Cliente no encontrado",
        description: "No existe un cliente con el DNI ingresado.",
      });
      return;
    }
    
    registrarAsistencia(cliente, "dni");
  };

  const simularHuella = () => {
    // Simula la lectura de una huella digital aleatoria
    const clienteAleatorio = clientesDemo[Math.floor(Math.random() * clientesDemo.length)];
    
    toast({
      title: "Huella detectada",
      description: "Procesando identificación...",
    });
    
    // Simula un pequeño retraso en el procesamiento
    setTimeout(() => {
      registrarAsistencia(clienteAleatorio, "huella");
    }, 1500);
  };

  // Obtener clientes de las asistencias
  const clientesConAsistencia = asistencias
    .filter((asistencia) =>
      asistencia.fecha.includes(searchTerm) ||
      clientesDemo
        .find((c) => c.id === asistencia.clienteId)
        ?.nombre.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      clientesDemo
        .find((c) => c.id === asistencia.clienteId)
        ?.dni.includes(searchTerm)
    )
    .map((asistencia) => {
      const cliente = clientesDemo.find((c) => c.id === asistencia.clienteId);
      return {
        asistencia,
        cliente,
      };
    });
    
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold">Control de Asistencia</h2>
        <p className="text-muted-foreground">
          Registro de entradas al gimnasio mediante huella digital o DNI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Asistencia</CardTitle>
            <CardDescription>
              Selecciona el método de verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={modoAsistencia === "dni" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setModoAsistencia("dni")}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Por DNI
              </Button>
              <Button
                variant={modoAsistencia === "huella" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setModoAsistencia("huella")}
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Por Huella
              </Button>
            </div>

            {modoAsistencia === "dni" ? (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ingresa el número de DNI"
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value)}
                  />
                  <Button onClick={registrarPorDNI}>Verificar</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ingresa el DNI del cliente y presiona Verificar para registrar su asistencia.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  className="w-full h-20 text-lg"
                  onClick={simularHuella}
                >
                  <Fingerprint className="mr-2 h-6 w-6" />
                  Colocar dedo en el lector
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  Coloca tu dedo en el lector de huella para registrar tu asistencia.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Asistencias</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Registro de hoy: {new Date().toLocaleDateString()}</span>
              <Badge variant="outline" className="ml-2">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {asistencias.filter(
                    (a) => a.fecha === new Date().toISOString().split("T")[0]
                  ).length}{" "}
                  hoy
                </span>
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o fecha..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-[300px] overflow-auto">
              {clientesConAsistencia.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesConAsistencia.map(({ asistencia, cliente }) => (
                      <TableRow key={asistencia.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={cliente?.avatarUrl} />
                              <AvatarFallback>
                                {cliente?.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{cliente?.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {cliente?.dni}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(asistencia.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{asistencia.hora}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            {asistencia.tipo === "huella" ? (
                              <Fingerprint className="h-3 w-3 mr-1" />
                            ) : (
                              <UserCheck className="h-3 w-3 mr-1" />
                            )}
                            {asistencia.tipo === "huella" ? "Huella" : "DNI"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <p>No hay registros de asistencia que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
