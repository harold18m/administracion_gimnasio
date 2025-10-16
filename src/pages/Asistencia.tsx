
import { useState, useEffect } from "react";
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
  UserCheck, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  QrCode as QrCodeIcon
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { formatISODate } from "@/lib/utils";

const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};



export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [clientes, setClientes] = useState<Database["public"]["Tables"]["clientes"]["Row"][]>([]);
  const [asistencias, setAsistencias] = useState<Database["public"]["Tables"]["asistencias"]["Row"][]>([]);
  const [modoAsistencia, setModoAsistencia] = useState<"qr" | "dni">("dni");
  const { toast } = useToast();
  // Huella deshabilitada: se elimina chequeo de agente

  useEffect(() => {
    loadClientes();
    loadAsistencias();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, dni, estado, avatar_url, membresia_id, nombre_membresia, tipo_membresia, fecha_fin")
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error cargando clientes",
        description: error.message,
      });
      return;
    }

    const clientesBase = data || [];

    // Si no hay nombre_membresia/tipo_membresia, intentar enriquecer usando la relación membresia_id
    const membresiaIds = Array.from(
      new Set(
        clientesBase
          .map((c) => c.membresia_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (membresiaIds.length > 0) {
      const { data: membresiasData, error: membresiasError } = await supabase
        .from("membresias")
        .select("id, nombre, tipo")
        .in("id", membresiaIds);

      if (!membresiasError && membresiasData) {
        const mapaMembresias = new Map(membresiasData.map((m) => [m.id, m]));
        const enriquecidos = clientesBase.map((c) => {
          const m = c.membresia_id ? mapaMembresias.get(c.membresia_id) : undefined;
          return {
            ...c,
            nombre_membresia: c.nombre_membresia ?? (m ? m.nombre : null),
            tipo_membresia: c.tipo_membresia ?? (m ? (m.tipo as Database["public"]["Tables"]["membresias"]["Row"]["tipo"]) : null),
          };
        });
        setClientes(enriquecidos);
        return;
      }
    }

    setClientes(clientesBase);
  };

  const loadAsistencias = async () => {
    const { data, error } = await supabase
      .from("asistencias")
      .select("id, cliente_id, fecha_asistencia, notas, created_at")
      .order("fecha_asistencia", { ascending: false })
      .limit(100);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error cargando asistencias",
        description: error.message,
      });
      return;
    }
    setAsistencias(data || []);
  };

  const registrarAsistencia = async (cliente: Database["public"]["Tables"]["clientes"]["Row"], tipo: "codigo" | "dni") => {
    if (cliente.estado === "vencida" || cliente.estado === "suspendida") {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "La membresía de este cliente no está activa.",
      });
      return;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: yaHoy, error: errorCheck } = await supabase
      .from("asistencias")
      .select("id")
      .eq("cliente_id", cliente.id)
      .gte("fecha_asistencia", startOfDay.toISOString())
      .lte("fecha_asistencia", endOfDay.toISOString());

    if (errorCheck) {
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: errorCheck.message,
      });
      return;
    }

    if (yaHoy && yaHoy.length > 0) {
      toast({
        variant: "destructive",
        title: "Registro duplicado",
        description: `${cliente.nombre} ya registró su asistencia hoy.`,
      });
      return;
    }

    const { data: inserted, error: errorInsert } = await supabase
      .from("asistencias")
      .insert({
        cliente_id: cliente.id,
        estado: "presente",
        notas: tipo,
      })
      .select("id, cliente_id, fecha_asistencia, notas, created_at")
      .single();

    if (errorInsert) {
      toast({
        variant: "destructive",
        title: "Error registrando asistencia",
        description: errorInsert.message,
      });
      return;
    }

    setAsistencias((prev) => (inserted ? [inserted, ...prev] : prev));

    const hora = new Date(inserted?.fecha_asistencia || Date.now())
      .toTimeString()
      .split(" ")[0];
    toast({
      title: "Asistencia registrada",
      description: `${cliente.nombre} ha registrado su asistencia a las ${hora}.`,
    });

    setDniInput("");
    setCodigoInput("");
  };

  const registrarPorDNI = async () => {
    if (!dniInput) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "Por favor, ingresa un DNI válido.",
      });
      return;
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("id, nombre, dni, estado, avatar_url")
      .eq("dni", dniInput)
      .maybeSingle();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error buscando cliente",
        description: error.message,
      });
      return;
    }

    if (!cliente) {
      toast({
        variant: "destructive",
        title: "Cliente no encontrado",
        description: "No existe un cliente con el DNI ingresado.",
      });
      return;
    }

    await registrarAsistencia(cliente, "dni");
  };
  const registrarPorQR = async () => {
    if (!codigoInput) {
      toast({ variant: "destructive", title: "Error de registro", description: "Ingresa un código válido." });
      return;
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("id, nombre, dni, estado, avatar_url")
      .eq("codigo_qr", codigoInput)
      .maybeSingle();

    if (error) {
      toast({ variant: "destructive", title: "Error buscando cliente", description: error.message });
      return;
    }

    if (!cliente) {
      toast({ variant: "destructive", title: "Cliente no encontrado", description: "No existe un cliente con el código ingresado." });
      return;
    }

    await registrarAsistencia(cliente, "qr");
  };

  // Obtener clientes de las asistencias (unir asistencias con clientes)
  const clientesConAsistencia = asistencias
    .filter((asistencia) => {
      const cliente = clientes.find((c) => c.id === asistencia.cliente_id);
      const nombreMatch = cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const dniMatch = (cliente?.dni || "").includes(searchTerm);
      const fechaMatch = new Date(asistencia.fecha_asistencia)
        .toLocaleDateString()
        .includes(searchTerm);
      return Boolean(nombreMatch || dniMatch || fechaMatch);
    })
    .map((asistencia) => {
      const cliente = clientes.find((c) => c.id === asistencia.cliente_id);
      const fecha = new Date(asistencia.fecha_asistencia);
      const hora = fecha.toTimeString().split(" ")[0];
      const tipo = asistencia.notas === "qr" ? "qr" : "dni";
      return {
        asistencia: {
          id: asistencia.id,
          fecha: asistencia.fecha_asistencia,
          hora,
          tipo,
        },
        cliente,
      };
    });
    
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold">Control de Asistencia</h2>
        <p className="text-muted-foreground">
          Registro de entradas al gimnasio mediante código QR o DNI
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
                variant={modoAsistencia === "qr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setModoAsistencia("qr")}
              >
                <QrCodeIcon className="mr-2 h-4 w-4" />
                Por QR
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
                <div className="flex space-x-2">
                  <Input
                    placeholder="Escanea o ingresa el código QR"
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') registrarPorQR(); }}
                  />
                  <Button onClick={registrarPorQR}>Verificar</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={scanActive ? "secondary" : "outline"} onClick={() => setScanActive((s) => !s)}>
                    {scanActive ? "Detener cámara" : "Activar cámara"}
                  </Button>
                </div>
                {scanActive && (
                  <div className="rounded-md overflow-hidden border">
                    <Scanner
                      onScan={(detectedCodes) => {
                        const value = Array.isArray(detectedCodes) ? (detectedCodes[0]?.rawValue || "") : "";
                        if (value) {
                          setCodigoInput(value);
                          registrarPorQR();
                        }
                      }}
                      onError={(error) => {
                        console.error(error);
                      }}
                    />
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Escanea con la cámara o usa un lector de QR; también puedes ingresar el código manualmente.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Asistencias</CardTitle>
            <CardDescription>
              Registro de hoy: {new Date().toLocaleDateString()}
            </CardDescription>
            <div className="flex items-center justify-end">
              <Badge variant="outline" className="ml-2">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {asistencias.filter(
                    (a) => new Date(a.fecha_asistencia).toDateString() === new Date().toDateString()
                  ).length}{" "}
                  hoy
                </span>
              </Badge>
            </div>
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
                      <TableHead>Membresía</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesConAsistencia.map(({ asistencia, cliente }) => (
                      <TableRow key={asistencia.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={cliente?.avatar_url || undefined} />
                              <AvatarFallback>
                                {cliente?.nombre
                                  ?.split(" ")
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
                          -                          {new Date(asistencia.fecha).toLocaleDateString()}
                          +                          {formatISODate(asistencia.fecha)}
                        </TableCell>
                        <TableCell>{asistencia.hora}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cliente?.nombre_membresia ?? "Sin membresía"}</p>
                            <p className="text-xs text-muted-foreground">{cliente?.tipo_membresia ?? ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          -                          {cliente?.fecha_fin ? new Date(cliente.fecha_fin).toLocaleDateString() : "—"}
                          +                          {cliente?.fecha_fin ? formatISODate(cliente.fecha_fin) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            {asistencia.tipo === "qr" ? (
                              <QrCodeIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <UserCheck className="h-3 w-3 mr-1" />
                            )}
                            {asistencia.tipo === "qr" ? "QR" : "DNI"}
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
