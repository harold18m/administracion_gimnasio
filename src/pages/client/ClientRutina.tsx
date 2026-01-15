import { useClientAuth } from "@/hooks/useClientAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, Dumbbell, Clock, Repeat } from "lucide-react";

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
  const [rutina, setRutina] = useState<any>(null);
  const [ejercicios, setEjercicios] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("lunes");

  const diasOrdenados = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  useEffect(() => {
    if (cliente?.id) {
      fetchRutina();
    }
  }, [cliente?.id]);

  const fetchRutina = async () => {
    try {
      // 1. Get latest routine
      const { data: rutinas, error: rutError } = await supabase
        .from('rutinas')
        .select('*')
        .eq('cliente_id', cliente?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rutError) throw rutError;

      if (rutinas && rutinas.length > 0) {
        const activeRutina = rutinas[0];
        setRutina(activeRutina);

        // 2. Get exercises
        const { data: exData, error: exError } = await supabase
          .from('rutina_ejercicios')
          .select(`
            *,
            ejercicio:ejercicios (
              nombre,
              musculos,
              imagen_url
            )
          `)
          .eq('rutina_id', activeRutina.id)
          .order('orden'); // Order by sequence

        if (exError) throw exError;
        setEjercicios(exData as any || []);
        
        // Auto-select current day if defined in routine
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        if (activeRutina.dias?.includes(today)) {
          setActiveTab(today);
        } else if (activeRutina.dias?.length > 0) {
          setActiveTab(activeRutina.dias[0]);
        }
      }
    } catch (error) {
      console.error("Error al cargar rutina:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExercisesByDay = (day: string) => {
    return ejercicios.filter(e => e.dia?.toLowerCase() === day.toLowerCase());
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  if (!rutina) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="bg-muted/50 p-6 rounded-full inline-block">
          <Dumbbell className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Sin Rutina Asignada</h2>
        <p className="text-muted-foreground text-sm">
          Aún no tienes una rutina personalizada. Acércate a tu entrenador para que te asigne una.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="space-y-1 shrink-0">
        <h1 className="text-2xl font-bold">{rutina.nombre}</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Plan de Entrenamiento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <ScrollArea className="w-full shrink-0">
          <TabsList className="w-full justify-start mb-4 bg-transparent p-0 gap-2">
            {diasOrdenados.map((dia) => {
              if (rutina.dias?.includes(dia)) { // Only show days that are part of the routine
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

        <div className="flex-1 overflow-y-auto pb-20">
          {diasOrdenados.map((dia) => (
            <TabsContent key={dia} value={dia} className="mt-0 space-y-4">
              {getExercisesByDay(dia).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Descanso o sin ejercicios asignados</p>
                </div>
              ) : (
                getExercisesByDay(dia).map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex">
                      {item.ejercicio.imagen_url && (
                        <div className="w-24 bg-muted shrink-0">
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
                          <Badge variant="secondary" className="text-[10px] h-5">
                            #{item.orden}
                          </Badge>
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
                ))
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
