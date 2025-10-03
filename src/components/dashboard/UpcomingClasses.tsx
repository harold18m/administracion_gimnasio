
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface GymClass {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  spots: string;
  category: string;
}

const categoryColors = {
  clase: "bg-green-100 text-green-800",
};

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export function UpcomingClasses() {
  const [todayClasses, setTodayClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("eventos")
          .select("id, titulo, entrenador, hora, duracion, max_participantes, participantes_actuales, tipo")
          .eq("tipo", "clase")
          .eq("fecha", todayStr)
          .order("hora", { ascending: true });

        if (error) {
          console.error("Error al cargar clases:", error);
          setTodayClasses([]);
        } else {
          const mapped = (data || []).map((e: any) => ({
            id: e.id,
            name: e.titulo,
            instructor: e.entrenador || "",
            time: e.hora,
            duration: `${e.duracion} min`,
            spots: `${e.participantes_actuales ?? 0}/${e.max_participantes ?? 0}`,
            category: "clase",
          }));
          setTodayClasses(mapped);
        }
      } catch (err) {
        console.error("Error al conectar con Supabase:", err);
        setTodayClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Próximas Clases</CardTitle>
        <CardDescription>Clases programadas para hoy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : todayClasses.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay clases programadas para hoy</div>
          ) : (
            todayClasses.map((gymClass) => (
              <div
                key={gymClass.id}
                className="flex flex-col space-y-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{gymClass.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {gymClass.instructor}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      categoryColors[
                        gymClass.category as keyof typeof categoryColors
                      ]
                    }
                  >
                    {gymClass.category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {gymClass.time} ({gymClass.duration})
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {gymClass.spots}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
