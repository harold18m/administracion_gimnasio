import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#94a3b8'];

export function MembershipChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchMemberships = async () => {
      // Fetch all clients with a membership
      const { data: clients, error } = await supabase
        .from('clientes')
        .select('nombre_membresia, estado, fecha_fin')
        .not('membresia_id', 'is', null);

      if (error) {
        console.error('Error fetching memberships:', error);
        return;
      }

      const counts = new Map<string, number>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      clients?.forEach(c => {
        let name = c.nombre_membresia || 'Sin Nombre';
        const fechaFin = c.fecha_fin ? new Date(c.fecha_fin) : null;
        
        // Categorize by status or name
        // Comprobar si está vencida por estado O por fecha
        if (c.estado === 'vencida' || (fechaFin && fechaFin < today)) {
          name = 'Vencidas';
        } else if (c.estado === 'suspendida') {
          name = 'Suspendidas';
        } 
        // Active ones keep their membership name

        counts.set(name, (counts.get(name) || 0) + 1);
      });

      const chartData = Array.from(counts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setData(chartData);
    };

    fetchMemberships();
  }, []);

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Distribución de Membresías</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
