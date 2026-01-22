import { useQuery } from "@tanstack/react-query";
import { useClientAuth } from "@/hooks/useClientAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, Dumbbell, Repeat, Play, Scale, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ActiveWorkoutView from "./components/ActiveWorkoutView";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Exercise {
  id: string;
  dia: string;
  orden: number;
  series: number;
  repeticiones: string;
  notas: string;
  ejercicio: {
    nombre: string;
    musculos: string[];
    imagen_url: string;
  };
}

export default function ClientRutina() {
  const { cliente } = useClientAuth();
  const [selectedRutina, setSelectedRutina] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("lunes");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isActiveSession, setIsActiveSession] = useState(false);

  // Weight State
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [addingWeight, setAddingWeight] = useState(false);

  const diasOrdenados = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  // Listen for reset event from navigation
  useEffect(() => {
    const handleReset = () => {
      setSelectedRutina(null);
    };
    window.addEventListener("reset-rutina-view", handleReset);
    return () => window.removeEventListener("reset-rutina-view", handleReset);
  }, []);

  const { data: rutinas = [], isLoading: loading } = useQuery({
    queryKey: ['rutinas', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const { data, error } = await supabase
        .from('rutinas')
        .select('*')
        .or(`cliente_id.eq.${cliente!.id},cliente_id.is.null`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cliente?.id,
  });

  const { data: ejercicios = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['rutina_ejercicios', selectedRutina?.id],
    queryFn: async () => {
      if (!selectedRutina?.id) return [];
      const { data, error } = await supabase
        .from('rutina_ejercicios')
        .select(`
          *,
          ejercicio:ejercicios (
            nombre,
            musculos,
            imagen_url
          )
        `)
        .eq('rutina_id', selectedRutina.id)
        .order('orden');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRutina?.id,
  });

  // Weight Metrics Query
  const { data: metrics = [], refetch: refetchMetrics } = useQuery({
    queryKey: ['client-metrics', cliente?.id],
    queryFn: async () => {
        if (!cliente?.id) return [];
        const { data, error } = await supabase
            .from('metricas_cliente')
            .select('*')
            .eq('cliente_id', cliente.id)
            .eq('tipo', 'peso')
            .order('fecha_registro', { ascending: false })
            .limit(20); // Fetched more data for chart
        
        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data;
    },
    enabled: !!cliente?.id,
  });

  const handleAddWeight = async () => {
      if (!newWeight || isNaN(Number(newWeight))) {
          toast.error("Ingresa un peso válido");
          return;
      }
      setAddingWeight(true);
      try {
          const { error } = await supabase.from('metricas_cliente').insert({
              cliente_id: cliente?.id,
              tipo: 'peso',
              valor: Number(newWeight),
              fecha_registro: new Date().toISOString().split('T')[0]
          });

          if (error) throw error;
          
          toast.success("Peso registrado");
          setNewWeight("");
          setIsWeightDialogOpen(false);
          refetchMetrics();
      } catch (error) {
          console.error(error);
          toast.error("Error al guardar peso");
      } finally {
          setAddingWeight(false);
      }
  };

  // Calculate trends
  const currentWeight = metrics[0]?.valor;
  const previousWeight = metrics[1]?.valor;
  const trend = currentWeight && previousWeight ? currentWeight - previousWeight : 0;
  
  // Format data for chart (reverse to show chronological order)
  const chartData = [...metrics].reverse().map(m => ({
      fecha: format(new Date(m.fecha_registro), "d MMM"),
      peso: Number(m.valor)
  }));

  // Effect to set active tab when exercises load or routine changes
  useEffect(() => {
    if (selectedRutina && ejercicios.length > 0) {
       const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
       const routineDaysLower = (selectedRutina.dias || []).map((d: string) => d.toLowerCase());
       
       if (routineDaysLower.includes(today)) {
         setActiveTab(today);
       } else if (selectedRutina.dias?.length > 0) {
         const firstDay = selectedRutina.dias[0].toLowerCase();
         setActiveTab(firstDay);
       } else {
         setActiveTab("lunes");
       }
    }
  }, [selectedRutina, ejercicios]);

  const getExercisesByDay = (day: string) => {
    return (ejercicios as any[]).filter(e => e.dia?.toLowerCase() === day.toLowerCase());
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const getRoutineVisuals = (nombre: string) => {
    const defaultImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3ltJTIwZml0bmVzc3xlbnwwfHwwfHx8MA%3D%3D";
    if (!nombre) return defaultImage;
    const n = nombre.toLowerCase();
    
    if (n.includes("cardio") || n.includes("correr") || n.includes("resistencia")) {
      return "https://img.freepik.com/foto-gratis/deportista-ropa-deportiva-entrenando-gimnasio_1157-30349.jpg?semt=ais_hybrid&w=740&q=80";
    }
    if (n.includes("fuerza") || n.includes("pesa") || n.includes("hipertrofia")) {
      return defaultImage;
    }
    if (n.includes("yoga") || n.includes("flexibilidad") || n.includes("estiramiento")) {
      return "https://www.centrovallereal.com/wp-content/uploads/sites/38/2019/07/yoga-disciplina.jpg";
    }
    if (n.includes("crossfit") || n.includes("funcional")) {
      return "https://images.unsplash.com/photo-1517963879466-cd11fa693184?auto=format&fit=crop&q=80&w=600";
    }
    if (n.includes("pierna") || n.includes("gluteo")) {
        return "https://www.vivagym.com/es-es/wp-content/uploads/sites/2/2025/06/mujer-haciendo-sentadilla-libre-sin-peso-1024x682.webp";
    }
    return defaultImage;
  };

  // View: List of Routines (Selection)
  if (!selectedRutina) {
    return (
      <div className="p-4 space-y-6 max-w-md mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Mis Rutinas</h1>
          <p className="text-muted-foreground text-sm">Selecciona tu entrenamiento de hoy</p>
        </div>

        {/* Weight Tracker Card */}
        <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mi Progreso de Peso</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Input Section */}
                    <div className="flex items-end gap-3 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex-1 space-y-2">
                             <Label htmlFor="peso">Nuevo Registro</Label>
                             <div className="relative">
                                <Input 
                                    id="peso" 
                                    type="number" 
                                    placeholder="00.0"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className="pl-8"
                                />
                                <Scale className="h-4 w-4 absolute left-2.5 top-3 text-muted-foreground" />
                             </div>
                        </div>
                        <Button onClick={handleAddWeight} disabled={addingWeight}>
                            {addingWeight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">Guardar</span>
                        </Button>
                    </div>

                    {/* Chart Section */}
                    <div className="h-[250px] w-full">
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="fecha" 
                                        tick={{fontSize: 12, fill: '#6B7280'}} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={['auto', 'auto']} 
                                        tick={{fontSize: 12, fill: '#6B7280'}} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="peso" 
                                        stroke="#4F46E5" 
                                        strokeWidth={3}
                                        dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Registra al menos 2 pesos para ver la gráfica</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 overflow-hidden relative cursor-pointer hover:shadow-md transition-all" onClick={() => setIsWeightDialogOpen(true)}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 p-2 rounded-full dark:bg-indigo-900/50">
                                <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Mi Peso</h3>
                                <p className="text-xs text-muted-foreground">Toca para ver historial</p>
                            </div>
                        </div>
                        {/* We removed the redundant Button trigger here since the whole card is clickable now, but we'll keep a visual indicator */}
                         <div className="bg-white/50 p-1.5 rounded-md dark:bg-black/20">
                            <TrendingUp className="h-4 w-4 text-indigo-400" />
                        </div>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        <div>
                            <span className="text-3xl font-extrabold tracking-tight">
                                {currentWeight ? `${currentWeight} kg` : "--"}
                            </span>
                            {trend !== 0 && (
                                <div className={`flex items-center text-xs font-semibold mt-1 ${trend < 0 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {trend < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                                    {Math.abs(trend).toFixed(1)} kg {trend < 0 ? 'menos' : 'más'}
                                </div>
                            )}
                        </div>
                        {metrics.length > 0 && (
                             <div className="text-[10px] text-muted-foreground text-right">
                                Último: {format(new Date(metrics[0].fecha_registro), "d MMM")}
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Dialog>

        <div className="grid gap-4">
        {rutinas.length === 0 ? (
            <div className="p-8 text-center space-y-4">
               <div className="bg-muted/50 p-6 rounded-full inline-block">
                 <Dumbbell className="h-10 w-10 text-muted-foreground" />
               </div>
               <h2 className="text-xl font-semibold">Sin Rutinas Disponibles</h2>
               <p className="text-muted-foreground text-sm">
                 No tienes rutinas asignadas ni hay rutinas públicas disponibles.
               </p>
             </div>
        ) : (
          rutinas.map((rutina) => {
            const bgImage = getRoutineVisuals(rutina.nombre || "");
            return (
              <Card 
                key={rutina.id} 
                className="group cursor-pointer overflow-hidden relative border-none shadow-lg hover:shadow-xl transition-all h-32"
                onClick={() => setSelectedRutina(rutina)}
              >
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

                <CardHeader className="relative z-10 h-full flex flex-col justify-between p-5">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold text-white leading-tight drop-shadow-md">
                        {rutina.nombre || "Rutina"}
                    </CardTitle>
                    {rutina.cliente_id ? (
                      <Badge className="bg-blue-600/90 hover:bg-blue-600 text-white border-none shadow-sm backdrop-blur-sm">
                          Personal
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-600/90 hover:bg-purple-600 text-white border-none shadow-sm backdrop-blur-sm">
                          Global
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <div className="flex -space-x-1 overflow-hidden">
                        {(rutina.dias || []).filter((d: any) => typeof d === 'string').slice(0, 4).map((d: string) => (
                            <div key={d} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase">
                                {d.charAt(0)}
                            </div>
                        ))}
                        {(rutina.dias || []).length > 4 && (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                +
                            </div>
                        )}
                     </div>
                     <span className="text-xs text-white/70 font-medium ml-1">
                        {(rutina.dias || []).length} días
                     </span>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
        </div>

        <div className="fixed bottom-10 left-4 w-40 z-50 pointer-events-none opacity-100 filter drop-shadow-lg">
            <img 
                src="/images/erizo_rutina.webp" 
                alt="Erizo Motivador" 
                className="w-full h-auto"
            />
        </div>
      </div>
    );
  }

  // View: Routine Details (Exercises)
  return (
    <div className="p-4 space-y-4 max-w-md mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="space-y-2 shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground -ml-2 h-8"
          onClick={() => setSelectedRutina(null)}
        >
          ← Volver a mis rutinas
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{selectedRutina.nombre}</h1>
          {!selectedRutina.cliente_id && (
             <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Global</Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
            {selectedRutina.notas && (
                <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground border">
                    <span className="font-semibold block mb-1 text-xs uppercase tracking-wide">Notas:</span>
                    {selectedRutina.notas}
                </div>
            )}
        </div>
      </div>

      {loadingExercises ? (
         <div className="flex-1 flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
         </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <ScrollArea className="w-full shrink-0">
            <TabsList className="w-full justify-start mb-4 bg-transparent p-0 gap-2">
              {diasOrdenados.map((dia) => {
                const isInRoutine = (selectedRutina.dias || []).some((d: string) => d.toLowerCase() === dia.toLowerCase());
                
                if (isInRoutine) { 
                  return (
                    <TabsTrigger 
                      key={dia} 
                      value={dia}
                      className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-accent/30 rounded-full px-4"
                    >
                      {dia.slice(0, 3)}
                    </TabsTrigger>
                  );
                }
                return null;
              })}
            </TabsList>
          </ScrollArea>

          <div className="flex-1 overflow-y-auto pb-20 relative">
            {diasOrdenados.map((dia) => (
              <TabsContent key={dia} value={dia} className="mt-0 space-y-4">
                {getExercisesByDay(dia).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Descanso o sin ejercicios asignados</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                       <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg shadow-md"
                        onClick={() => setIsActiveSession(true)}
                       >
                          <Play className="mr-2 h-5 w-5" fill="currentColor" /> Iniciar Rutina
                       </Button>
                    </div>

                    {getExercisesByDay(dia).map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="flex">
                          {item.ejercicio.imagen_url && (
                            <div 
                              className="w-24 bg-muted shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImage(item.ejercicio.imagen_url)}
                            >
                               <img 
                                src={item.ejercicio.imagen_url} 
                                alt={item.ejercicio.nombre}
                                className="w-full h-full object-cover"
                              /> 
                            </div>
                          )}
                          <div className="flex-1 p-3 space-y-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-sm leading-tight">{item.ejercicio.nombre}</h3>
                            </div>
                            
                            <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                              <div className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                <span>{item.series} series</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                <span>{item.repeticiones} reps</span>
                              </div>
                            </div>

                            {item.notas && (
                              <div className="text-xs bg-muted/50 p-1.5 rounded mt-2">
                                📝 {item.notas}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      )}

      {isActiveSession && (
        <ActiveWorkoutView 
          exercises={getExercisesByDay(activeTab)}
          onClose={() => setIsActiveSession(false)}
          onComplete={() => {
            setIsActiveSession(false);
            // Optional: Show completion success message
          }}
        />
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="p-0 overflow-hidden max-w-sm mx-auto rounded-lg">
          {selectedImage && (
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <img 
                src={selectedImage} 
                alt="Ejercicio detalle" 
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
