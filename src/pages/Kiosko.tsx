import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { Camera, CheckCircle2, User2, IdCard, Star, CalendarRange, XCircle, AlertTriangle, BarChart3 } from "lucide-react";

export default function Kiosko() {
  const { toast } = useToast();
  const [scanActive] = useState(true);
  const [horaActual, setHoraActual] = useState<string>(new Date().toLocaleTimeString());
  const [puertaEstado, setPuertaEstado] = useState<"desconectada" | "conectada" | "abriendo" | "error">("desconectada");
  const serialDisponible = typeof (navigator as any).serial !== "undefined";
  
  const [ultimoCliente, setUltimoCliente] = useState<Database["public"]["Tables"]["clientes"]["Row"] | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string>("");
  const [ultimoCodigoQR, setUltimoCodigoQR] = useState<string>("");
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
  const [overlayKind, setOverlayKind] = useState<"granted" | "denied" | null>(null);
  const [overlayDeniedReason, setOverlayDeniedReason] = useState<"unknown" | "expired" | "suspended" | "weekly_limit" | null>(null);
  const [asistenciasSemana, setAsistenciasSemana] = useState<number>(0);
  const LIMITE_SEMANAL_INTERDIARIO = 3;
  const lastCodeRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const overlayTimerRef = useRef<number | null>(null);
  const scannerAreaRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const serialPortRef = useRef<any>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const encoderRef = useRef(new TextEncoder());

  const playAccessSound = async () => {
    try {
      if (!audioCtxRef.current) {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = AC ? new AC() : null;
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch {}
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // tono bajo
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02); // volumen suave
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Silenciar cualquier error de audio para no interrumpir el flujo del kiosko
    }
  };

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
    cliente: Database["public"]["Tables"]["clientes"]["Row"],
    esInterdiario?: boolean
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

    // Consultar asistencias semanales para TODOS los clientes
    let asistenciasSemanales = 0;
    const { data: countData, error: countError } = await supabase
      .rpc("get_weekly_attendance_count", { client_id: cliente.id });
    
    if (countError) {
      console.warn("Error al obtener asistencias semanales:", countError.message);
      // Intentar contar manualmente si la función RPC no existe
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lunes
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const { data: asistenciasData } = await supabase
        .from("asistencias")
        .select("fecha_asistencia")
        .eq("cliente_id", cliente.id)
        .gte("fecha_asistencia", weekStart.toISOString())
        .lte("fecha_asistencia", weekEnd.toISOString());
      
      // Contar días únicos
      if (asistenciasData) {
        const diasUnicos = new Set(asistenciasData.map(a => a.fecha_asistencia.split('T')[0]));
        asistenciasSemanales = diasUnicos.size;
      }
    } else {
      asistenciasSemanales = countData ?? 0;
    }
    setAsistenciasSemana(asistenciasSemanales);
    
    // Validar límite semanal solo para membresías interdiarias
    if (esInterdiario) {
      
      // Verificar si ya alcanzó el límite y NO tiene asistencia hoy
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: yaHoy } = await supabase
        .from("asistencias")
        .select("id")
        .eq("cliente_id", cliente.id)
        .gte("fecha_asistencia", startOfDay.toISOString())
        .lte("fecha_asistencia", endOfDay.toISOString());

      const tieneAsistenciaHoy = yaHoy && yaHoy.length > 0;
      
      // Si ya tiene asistencia hoy, permitir re-acceso
      if (tieneAsistenciaHoy) {
        const hora = new Date().toTimeString().split(" ")[0];
        setUltimoCliente(cliente);
        setUltimaHora(hora);
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
        playAccessSound();
        abrirCerradura();
        return;
      }
      
      // Si alcanzó el límite y no tiene asistencia hoy, denegar
      if (asistenciasSemanales >= LIMITE_SEMANAL_INTERDIARIO) {
        setUltimoCliente(cliente);
        setOverlayKind("denied");
        setOverlayDeniedReason("weekly_limit");
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
      // Ya tiene asistencia hoy, permitir re-acceso sin duplicar
      const hora = new Date().toTimeString().split(" ")[0];
      setUltimoCliente(cliente);
      setUltimaHora(hora);
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
      playAccessSound();
      abrirCerradura();
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

    // Actualizar contador de asistencias semanales después de registrar
    setAsistenciasSemana(asistenciasSemanales + 1);

    const hora = new Date(inserted?.fecha_asistencia || Date.now()).toTimeString().split(" ")[0];
    setUltimoCliente(cliente);
    setUltimaHora(hora);

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
    // Sonido de acceso concedido
    playAccessSound();
    abrirCerradura();
  };

  const conectarCerradura = async () => {
    if (!serialDisponible) {
      toast({ variant: "destructive", title: "Serial no disponible", description: "Usa Chrome/Edge" });
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort({ filters: [] });
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      const writer = port.writable?.getWriter();
      writerRef.current = writer || null;
      setPuertaEstado("conectada");
      toast({ title: "Puerta conectada", description: "Listo para abrir" });
    } catch (e: any) {
      setPuertaEstado("error");
      toast({ variant: "destructive", title: "Error conectando", description: String(e?.message || e) });
    }
  };

  const abrirCerradura = async (ms: number = 2000) => {
    try {
      if (!writerRef.current) return;
      setPuertaEstado("abriendo");
      await writerRef.current.write(encoderRef.current.encode("O"));
      window.setTimeout(async () => {
        try {
          if (writerRef.current) {
            await writerRef.current.write(encoderRef.current.encode("C"));
          }
          setPuertaEstado("conectada");
        } catch {
          setPuertaEstado("error");
        }
      }, ms);
    } catch {
      setPuertaEstado("error");
    }
  };

  useEffect(() => {
    return () => {
      try {
        writerRef.current?.releaseLock();
        serialPortRef.current?.close?.();
      } catch {}
    };
  }, []);

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
      .select("id, nombre, dni, estado, avatar_url, nombre_membresia, tipo_membresia, fecha_fin, membresia_id")
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

    // Consultar nombre y modalidad de la membresía para mostrar correctamente
    let esInterdiario = false;
    let nombreMembresia: string | null | undefined = cliente.nombre_membresia;
    let modalidadMembresia: string | null | undefined = cliente.tipo_membresia;
    if (cliente.membresia_id) {
      const { data: membresia } = await supabase
        .from("membresias")
        .select("nombre, modalidad")
        .eq("id", cliente.membresia_id)
        .maybeSingle();
      esInterdiario = membresia?.modalidad === "interdiario";
      nombreMembresia = nombreMembresia ?? membresia?.nombre ?? null;
      modalidadMembresia = modalidadMembresia ?? membresia?.modalidad ?? null;
    }

    // Enriquecer cliente para que el overlay muestre la membresía actual
    const clienteConMembresia = {
      ...cliente,
      nombre_membresia: nombreMembresia ?? cliente.nombre_membresia ?? null,
      tipo_membresia: modalidadMembresia ?? cliente.tipo_membresia ?? null,
    } as Database["public"]["Tables"]["clientes"]["Row"];

    setUltimoCodigoQR(valor);
    await registrarAsistencia(clienteConMembresia, esInterdiario);
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
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-300">Puerta: {serialDisponible ? puertaEstado : "no soportado"}</div>
            {serialDisponible && (
              <button
                onClick={conectarCerradura}
                className="px-3 py-1 text-sm rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
              >
                Conectar puerta
              </button>
            )}
          </div>
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
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="max-w-sm w-[90%] rounded-2xl bg-white shadow-2xl overflow-hidden">
                      {/* Header verde */}
                      <div className="bg-emerald-500 px-6 py-8 text-center relative">
                        <button 
                          onClick={() => setOverlayVisible(false)}
                          className="absolute top-3 right-3 text-white/80 hover:text-white text-xl font-bold"
                        >
                          ×
                        </button>
                        <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-white">¡Acceso Autorizado!</div>
                      </div>
                      
                      {/* Contenido blanco */}
                      <div className="px-6 py-5">
                        <div className="text-center mb-4">
                          <div className="text-sm text-gray-500">Miembro</div>
                          <div className="text-xl font-bold text-gray-800">{ultimoCliente.nombre}</div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Tipo de Membresía */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Star className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Tipo de Membresía</div>
                              <div className="text-sm font-semibold text-gray-800">{ultimoCliente.nombre_membresia || ultimoCliente.tipo_membresia || "Sin membresía"}</div>
                            </div>
                          </div>
                          
                          {/* Visitas Esta Semana - Ahora se muestra para TODOS */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Visitas Esta Semana</div>
                              <div className="text-sm font-semibold text-gray-800">{asistenciasSemana} visitas</div>
                            </div>
                          </div>
                          
                          {/* Válida Hasta */}
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <CalendarRange className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Válida Hasta</div>
                              <div className="text-sm font-semibold text-gray-800">{formatoFecha(ultimoCliente.fecha_fin)}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de confirmación */}
                        <div className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <span className="text-emerald-600 font-medium">✓ Disfruta tu entrenamiento</span>
                        </div>
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
                          {overlayDeniedReason === "weekly_limit" && "Límite semanal alcanzado"}
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
                      ) : overlayDeniedReason === "weekly_limit" ? (
                        <div className="rounded-xl border border-orange-700/30 bg-orange-900/10 p-4 text-left">
                          <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="h-14 w-14 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center">
                              <BarChart3 className="h-7 w-7 text-orange-300" />
                            </div>
                            <div className="text-xl font-bold text-white">{ultimoCliente?.nombre}</div>
                            <div className="text-xs text-orange-300">Membresía Interdiaria</div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border border-orange-800/40 bg-neutral-800/40 p-3">
                              <BarChart3 className="h-5 w-5 text-orange-300" />
                              <div className="flex-1">
                                <div className="text-xs text-neutral-400">Visitas esta semana</div>
                                <div className="text-sm font-medium text-orange-400">{asistenciasSemana}/{LIMITE_SEMANAL_INTERDIARIO} (límite alcanzado)</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 text-sm text-neutral-200 font-semibold">Para acceder al gimnasio:</div>
                          <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
                            <li>Espera hasta el próximo lunes para reiniciar tu contador</li>
                            <li>O actualiza tu membresía a una modalidad diaria o libre en recepción</li>
                          </ul>
                          <div className="text-center text-[11px] text-neutral-400 mt-3">Redirigiendo en 5 segundos...</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-4 text-left">
                          <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="h-14 w-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                              <AlertTriangle className="h-7 w-7 text-red-300" />
                            </div>
                            <div className="text-xl font-bold text-white">{ultimoCliente?.nombre}</div>
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