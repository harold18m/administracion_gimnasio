import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { QrCode as QrCodeIcon, Maximize, Minimize, Camera } from "lucide-react";

export default function Kiosko() {
  const { toast } = useToast();
  const [scanActive, setScanActive] = useState(true);
  const [codigoInput, setCodigoInput] = useState("");
  const [ultimoCliente, setUltimoCliente] = useState<Database["public"]["Tables"]["clientes"]["Row"] | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const lastCodeRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  const registrarAsistencia = async (
    cliente: Database["public"]["Tables"]["clientes"]["Row"]
  ) => {
    if (cliente.estado === "vencida" || cliente.estado === "suspendida") {
      toast({
        variant: "destructive",
        title: "Membresía no activa",
        description: "Consulta en recepción para renovar o habilitar.",
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
      toast({ variant: "destructive", title: "Error", description: errorCheck.message });
      return;
    }

    if (yaHoy && yaHoy.length > 0) {
      toast({
        variant: "destructive",
        title: "Ya registrado",
        description: `${cliente.nombre} ya tiene una asistencia hoy.`,
      });
      setUltimoCliente(cliente);
      const hora = new Date().toTimeString().split(" ")[0];
      setUltimaHora(hora);
      return;
    }

    const { data: inserted, error: errorInsert } = await supabase
      .from("asistencias")
      .insert({ cliente_id: cliente.id, estado: "presente", notas: "qr" })
      .select("id, cliente_id, fecha_asistencia")
      .single();

    if (errorInsert) {
      toast({ variant: "destructive", title: "Error al registrar", description: errorInsert.message });
      return;
    }

    const hora = new Date(inserted?.fecha_asistencia || Date.now()).toTimeString().split(" ")[0];
    setUltimoCliente(cliente);
    setUltimaHora(hora);
    toast({ title: "¡Bienvenido!", description: `${cliente.nombre} registrado a las ${hora}.` });
  };

  const registrarPorQR = async (valor: string) => {
    if (!valor) {
      toast({ variant: "destructive", title: "Código inválido", description: "Intenta nuevamente." });
      return;
    }

    // Anti-doble lectura en ráfaga
    const now = Date.now();
    if (lastCodeRef.current === valor && now - lastTimeRef.current < 5000) {
      return; // Ignora duplicado dentro de 5 segundos
    }
    lastCodeRef.current = valor;
    lastTimeRef.current = now;

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("id, nombre, dni, estado, avatar_url")
      .eq("codigo_qr", valor)
      .maybeSingle();

    if (error) {
      toast({ variant: "destructive", title: "Error buscando cliente", description: error.message });
      return;
    }

    if (!cliente) {
      toast({ variant: "destructive", title: "No encontrado", description: "Verifica tu código QR." });
      return;
    }

    await registrarAsistencia(cliente);
    setCodigoInput("");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Kiosko de Registro</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={scanActive ? "secondary" : "outline"} onClick={() => setScanActive((s) => !s)}>
              <Camera className="h-4 w-4 mr-2" />
              {scanActive ? "Detener cámara" : "Activar cámara"}
            </Button>
            <Button variant="outline" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
              {fullscreen ? "Salir pantalla completa" : "Pantalla completa"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Escanea tu código QR</CardTitle>
              <CardDescription>Acerca el QR a la cámara o ingrésalo manualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanActive && (
                <div className="rounded-md overflow-hidden border border-neutral-800">
                  <Scanner
                    onScan={(detectedCodes) => {
                      const value = Array.isArray(detectedCodes) ? (detectedCodes[0]?.rawValue || "") : "";
                      if (value) {
                        registrarPorQR(value);
                      }
                    }}
                    onError={(error) => {
                      console.error(error);
                    }}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa tu código QR"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") registrarPorQR(codigoInput); }}
                  className="bg-neutral-800 text-white border-neutral-700"
                />
                <Button onClick={() => registrarPorQR(codigoInput)}>Registrar</Button>
              </div>
              <p className="text-sm text-muted-foreground">Para mejor resultado, usa un QR nítido y evita reflejos en la cámara.</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Último registro</CardTitle>
              <CardDescription>Confirmación visual del cliente registrado</CardDescription>
            </CardHeader>
            <CardContent>
              {ultimoCliente ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">{ultimoCliente.nombre}</span>
                    <Badge variant="outline" className="capitalize">
                      {ultimoCliente.estado}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ultimaHora ? `Registrado a las ${ultimaHora}` : "Registro confirmado"}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Aún no hay registros en esta sesión.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}