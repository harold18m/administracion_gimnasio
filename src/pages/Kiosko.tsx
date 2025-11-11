import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { Camera, CheckCircle2, User2, IdCard, Star, CalendarRange, XCircle, AlertTriangle } from "lucide-react";

export default function Kiosko() {
  const { toast } = useToast();
  const [scanActive] = useState(true);
  const [horaActual, setHoraActual] = useState<string>(new Date().toLocaleTimeString());
  
  const [ultimoCliente, setUltimoCliente] = useState<Database["public"]["Tables"]["clientes"]["Row"] | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string>("");
  const [ultimoCodigoQR, setUltimoCodigoQR] = useState<string>("");
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
  const [overlayKind, setOverlayKind] = useState<"granted" | "denied" | null>(null);
  const [overlayDeniedReason, setOverlayDeniedReason] = useState<"unknown" | "expired" | "suspended" | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const overlayTimerRef = useRef<number | null>(null);
  const scannerAreaRef = useRef<HTMLDivElement | null>(null);

  // Determina si la membresía está vencida por fecha_fin
  const estaVencidaPorFecha = (fin?: string | null) => {
    if (!fin) return false;
    const ahora = new Date();
    const finDate = new Date(fin);
    // Considera vigente hasta el final del día local de fecha_fin
    finDate.setHours(23, 59, 59, 999);
    return ahora.getTime() > finDate.getTime();
  };

  const registrarAsistencia = async (
    cliente: Database["public"]["Tables"]["clientes"]["Row"]
  ) => {
    const vencidaPorFecha = estaVencidaPorFecha(cliente.fecha_fin);
    const suspendida = cliente.estado === "suspendida";
    const vencidaEstado = cliente.estado === "vencida";
    if (vencidaPorFecha || suspendida || vencidaEstado) {
      // Mostrar overlay de acceso denegado
      setUltimoCliente(cliente);
      setOverlayKind("denied");
      setOverlayDeniedReason(vencidaPorFecha || vencidaEstado ? "expired" : "suspended");
      setOverlayVisible(true);
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
      overlayTimerRef.current = window.setTimeout(() => {
        setOverlayVisible(false);
        setOverlayKind(null);
        setOverlayDeniedReason(null);
        setUltimoCliente(null);
        setUltimoCodigoQR("");
      }, 5000);
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

    // Mostrar overlay de acceso concedido 5 segundos y luego volver a la cámara
    setOverlayKind("granted");
    setOverlayVisible(true);
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    overlayTimerRef.current = window.setTimeout(() => {
      setOverlayVisible(false);
      setOverlayKind(null);
      setOverlayDeniedReason(null);
      setUltimoCliente(null);
      setUltimoCodigoQR("");
    }, 5000);
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
      .select("id, nombre, dni, estado, avatar_url, nombre_membresia, tipo_membresia, fecha_fin")
      .eq("codigo_qr", valor)
      .maybeSingle();

    if (error) {
      toast({ variant: "destructive", title: "Error buscando cliente", description: error.message });
      return;
    }

    if (!cliente) {
      // Mostrar overlay de acceso denegado por usuario no registrado
      setOverlayKind("denied");
      setOverlayDeniedReason("unknown");
      setUltimoCliente(null);
      setOverlayVisible(true);
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
      overlayTimerRef.current = window.setTimeout(() => {
        setOverlayVisible(false);
        setOverlayKind(null);
        setOverlayDeniedReason(null);
      }, 5000);
      return;
    }

    setUltimoCodigoQR(valor);
    await registrarAsistencia(cliente);
  };

  // Utilidad para formatear fecha YYYY-MM-DD
  const formatoFecha = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return String(iso);
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col items-center p-6">
      {/* Hora en la esquina superior derecha */}
      <div className="fixed top-4 right-6 z-30">
        <span className="px-4 py-2 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-100 font-mono text-3xl tracking-tight shadow-sm">
          {horaActual}
        </span>
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className="h-12 w-12 rounded-full bg-orange-500/10 border border-orange-500/40 flex items-center justify-center mb-2">
          <Camera className="h-6 w-6 text-orange-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-wide">CONTROL DE ASISTENCIA</h1>
        <p className="text-sm text-muted-foreground">Escanea tu código QR para acceder</p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 w-full max-w-2xl">
        <CardContent className="pt-6 space-y-4">
          {scanActive && (
            <div ref={scannerAreaRef} className="relative rounded-lg overflow-hidden border border-neutral-800">
              <Scanner
                onScan={(detectedCodes: any) => {
                  let value = "";
                  if (Array.isArray(detectedCodes)) {
                    const rect = scannerAreaRef.current?.getBoundingClientRect();
                    if (rect) {
                      const padX = rect.width * 0.25;
                      const padY = rect.height * 0.25;
                      const left = rect.left + padX;
                      const right = rect.right - padX;
                      const top = rect.top + padY;
                      const bottom = rect.bottom - padY;
                      for (const c of detectedCodes) {
                        const box = c?.boundingBox;
                        let cx: number | undefined;
                        let cy: number | undefined;
                        if (box && typeof box.x === "number") {
                          cx = box.x + box.width / 2;
                          cy = box.y + box.height / 2;
                        } else if (Array.isArray(c?.cornerPoints) && c.cornerPoints.length) {
                          const xs = c.cornerPoints.map((p: any) => p.x);
                          const ys = c.cornerPoints.map((p: any) => p.y);
                          cx = xs.reduce((a: number, b: number) => a + b, 0) / xs.length;
                          cy = ys.reduce((a: number, b: number) => a + b, 0) / ys.length;
                        }
                        if (cx !== undefined && cy !== undefined) {
                          if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
                            value = c?.rawValue || "";
                            break;
                          }
                        }
                      }
                    }
                    if (!value) {
                      value = detectedCodes[0]?.rawValue || "";
                    }
                  }
                  if (value) registrarPorQR(value);
                }}
                onError={(error) => console.error(error)}
              />
              {/* Overlay de enfoque */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-md border-2 border-orange-500/80 shadow-[0_0_20px_rgba(234,88,12,0.3)] animate-pulse"></div>
              </div>
              {/* Overlays encima de la cámara: acceso concedido o denegado */}
              {overlayVisible && (
                overlayKind === "granted" && ultimoCliente && ultimoCliente.estado === "activa" && !estaVencidaPorFecha(ultimoCliente.fecha_fin) ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
                    <div className="max-w-md w-[92%] rounded-2xl border border-green-700/40 bg-neutral-900/90 p-6 text-center">
                      <div className="flex flex-col items-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-green-600/10 border border-green-500/40 flex items-center justify-center mb-2">
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-green-400">¡Acceso Concedido!</div>
                        <div className="text-sm text-neutral-300">Bienvenido al gimnasio</div>
                      </div>

                      <div className="rounded-xl border border-green-700/30 bg-green-900/10 p-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-14 w-14 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center">
                            <User2 className="h-7 w-7 text-orange-400" />
                          </div>
                          <div className="text-xl font-bold">{ultimoCliente.nombre}</div>
                          <div className="text-xs text-green-300">Miembro Verificado</div>
                        </div>

                        <div className="mt-4 space-y-3 text-left">
                          <div className="flex items-center gap-3 rounded-lg border border-green-800/40 bg-neutral-800/40 p-3">
                            <IdCard className="h-5 w-5 text-neutral-300" />
                            <div className="flex-1">
                              <div className="text-xs text-neutral-400">ID de Miembro</div>
                              <div className="text-sm font-medium">{ultimoCodigoQR || ultimoCliente.dni || ultimoCliente.id}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-lg border border-green-800/40 bg-neutral-800/40 p-3">
                            <Star className="h-5 w-5 text-neutral-300" />
                            <div className="flex-1">
                              <div className="text-xs text-neutral-400">Tipo de Membresía</div>
                              <div className="text-sm font-medium">{ultimoCliente.nombre_membresia || ultimoCliente.tipo_membresia || "-"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-lg border border-green-800/40 bg-neutral-800/40 p-3">
                            <CalendarRange className="h-5 w-5 text-neutral-300" />
                            <div className="flex-1">
                              <div className="text-xs text-neutral-400">Válida Hasta</div>
                              <div className="text-sm font-medium">{formatoFecha(ultimoCliente.fecha_fin)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center text-xs text-green-300 mt-3">¡Que tengas un excelente entrenamiento!</div>
                        <div className="text-center text-xs text-neutral-400">{ultimaHora ? `Registrado a las ${ultimaHora}` : "Registro confirmado"}</div>
                      </div>
                    </div>
                  </div>
                ) : overlayKind === "denied" ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
                    <div className="max-w-md w-[92%] rounded-2xl border border-red-700/40 bg-neutral-900/90 p-6 text-center">
                      <div className="flex flex-col items-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-red-600/10 border border-red-500/40 flex items-center justify-center mb-2">
                          <XCircle className="h-8 w-8 text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-400">Acceso Denegado</div>
                        <div className="text-sm text-neutral-300">
                          {overlayDeniedReason === "unknown" && "Usuario no registrado"}
                          {overlayDeniedReason === "expired" && "Membresía vencida"}
                          {overlayDeniedReason === "suspended" && "Membresía suspendida"}
                        </div>
                      </div>

                      {/* Contenido variable según motivo de denegación */}
                      {overlayDeniedReason === "unknown" ? (
                        <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-4 text-left">
                          <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="h-5 w-5 text-red-300" />
                            <div className="text-base font-semibold">Desconocido</div>
                          </div>
                          <div className="text-sm text-neutral-200 font-semibold mb-2">Para acceder al gimnasio:</div>
                          <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
                            <li>Dirígete a recepción para registrarte</li>
                            <li>Verifica que tu código QR sea correcto</li>
                          </ul>
                          <div className="text-center text-[11px] text-neutral-400 mt-3">Redirigiendo en 5 segundos...</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-4 text-left">
                          <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="h-14 w-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                              <AlertTriangle className="h-7 w-7 text-red-300" />
                            </div>
                            <div className="text-xl font-bold">{ultimoCliente?.nombre}</div>
                            <div className="text-xs text-red-300">
                              {overlayDeniedReason === "expired" ? "Membresía Expirada" : "Membresía Suspendida"}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border border-red-800/40 bg-neutral-800/40 p-3">
                              <IdCard className="h-5 w-5 text-neutral-300" />
                              <div className="flex-1">
                                <div className="text-xs text-neutral-400">ID de Miembro</div>
                                <div className="text-sm font-medium">{ultimoCodigoQR || ultimoCliente?.dni || ultimoCliente?.id}</div>
                              </div>
                            </div>

                            {overlayDeniedReason === "expired" && (
                              <div className="flex items-center gap-3 rounded-lg border border-red-800/40 bg-neutral-800/40 p-3">
                                <CalendarRange className="h-5 w-5 text-neutral-300" />
                                <div className="flex-1">
                                  <div className="text-xs text-neutral-400">Fecha de Vencimiento</div>
                                  <div className="text-sm font-medium">{formatoFecha(ultimoCliente?.fecha_fin)}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 text-sm text-neutral-200 font-semibold">Para acceder al gimnasio:</div>
                          <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
                            {overlayDeniedReason === "expired" ? (
                              <>
                                <li>Renueva tu membresía en recepción</li>
                                <li>O contáctanos para opciones de renovación</li>
                              </>
                            ) : (
                              <>
                                <li>Consulta en recepción para habilitar tu membresía</li>
                                <li>Verifica tu estado con el personal</li>
                              </>
                            )}
                          </ul>
                          <div className="text-center text-[11px] text-neutral-400 mt-3">Redirigiendo en 5 segundos...</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          </div>

          
        </CardContent>
      </Card>
    </div>
  );
}