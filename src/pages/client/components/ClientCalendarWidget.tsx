import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Dumbbell, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientCalendarWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get start/end of the week for the selected date
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });

  // Generate days array for the tabs
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['client-events', format(startDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('visible_para_clientes', true)
        .gte('fecha', format(startDate, 'yyyy-MM-dd'))
        .lte('fecha', format(endDate, 'yyyy-MM-dd'))
        .order('hora', { ascending: true });
        
      if (error) throw error;
      return data;
    }
  });

  const selectedEvents = events.filter(e => isSameDay(new Date(e.fecha + 'T00:00:00'), selectedDate));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> 
              Clases de la Semana
          </h2>
      </div>

      {/* Week Tabs */}
      <div className="flex justify-between bg-muted/30 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
          {weekDays.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrent = isToday(day);
              return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                        flex flex-col items-center justify-center min-w-[3rem] py-2 px-1 rounded-lg transition-all
                        ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}
                        ${isCurrent && !isSelected ? 'border border-primary/50 text-primary' : ''}
                    `}
                  >
                      <span className="text-[10px] uppercase font-bold tracking-wider">{format(day, 'EEE', { locale: es })}</span>
                      <span className={`text-lg font-bold leading-none ${isSelected ? '' : 'text-foreground'}`}>
                          {format(day, 'd')}
                      </span>
                  </button>
              );
          })}
      </div>

      {/* Events List */}
      <div className="space-y-3 min-h-[150px]">
          {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-xs">Cargando horario...</span>
              </div>
          ) : selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <Info className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No hay clases programadas</p>
                  <p className="text-xs">Selecciona otro día</p>
              </div>
          ) : (
              selectedEvents.map(event => (
                  <Card key={event.id} className="border-none shadow-sm bg-card hover:bg-accent/5 transition-colors overflow-hidden">
                      <div className="flex">
                          {/* Time Column */}
                          <div className="w-16 bg-muted/30 flex flex-col items-center justify-center p-2 border-r border-border/50">
                              <span className="text-sm font-bold text-primary">{event.hora.slice(0, 5)}</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1 mt-1 border-none bg-background/80">
                                  {event.duracion}min
                              </Badge>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-3">
                              <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-bold text-sm leading-tight">{event.titulo}</h3>
                                  {event.tipo === 'clase' && (
                                     <Badge className="bg-green-100 text-green-700 h-5 text-[10px] px-1.5 shadow-none border-0 hover:bg-green-100">Grupal</Badge>
                                  )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground space-y-1">
                                  {event.entrenador && (
                                      <div className="flex items-center gap-1.5">
                                          <Users className="h-3 w-3" />
                                          <span>Coach: {event.entrenador}</span>
                                      </div>
                                  )}
                                  
                                  {event.max_participantes > 1 && (
                                      <div className="flex items-center gap-1.5">
                                          <Star className="h-3 w-3" />
                                          <span>Cupos: {event.participantes_actuales || 0}/{event.max_participantes}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </Card>
              ))
          )}
      </div>
    </div>
  );
}
