
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Plan = {
    id: string;
    name: string;
    price: number;
    max_clients: number;
    max_employees: number;
    features: any;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      id: '',
      name: '',
      price: 0,
      max_clients: 50,
      max_employees: 2
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
    if (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los planes" });
    } else {
        setPlans(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const payload = {
          id: formData.id.toLowerCase().replace(/\s+/g, '-'), // Slugify ID if new
          name: formData.name,
          price: formData.price,
          max_clients: formData.max_clients,
          max_employees: formData.max_employees
      };

      try {
          let error;
          if (editingId) {
             // Update existing (cannot change ID)
             const { error: err } = await supabase.from('plans').update({
                 name: payload.name,
                 price: payload.price,
                 max_clients: payload.max_clients,
                 max_employees: payload.max_employees
             }).eq('id', editingId);
             error = err;
          } else {
             // Create New
             const { error: err } = await supabase.from('plans').insert([payload]);
             error = err;
          }

          if (error) throw error;

          toast({ title: "Éxito", description: editingId ? "Plan actualizado" : "Plan creado" });
          setIsDialogOpen(false);
          fetchPlans();
          setEditingId(null);
          setFormData({ id: '', name: '', price: 0, max_clients: 50, max_employees: 2 });

      } catch (err: any) {
          console.error(err);
          toast({ variant: "destructive", title: "Error", description: err.message || "Error al guardar plan" });
      }
  };

  const handleEdit = (plan: Plan) => {
      setEditingId(plan.id);
      setFormData({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          max_clients: plan.max_clients,
          max_employees: plan.max_employees
      });
      setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      if(!confirm("¿Estás seguro? Esto podría afectar a los gimnasios que usen este plan.")) return;
      
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar (quizás esté en uso)" });
      } else {
          toast({ title: "Eliminado", description: "Plan eliminado correctamente" });
          fetchPlans();
      }
  };

  const openNew = () => {
      setEditingId(null);
      setFormData({ id: '', name: '', price: 0, max_clients: 50, max_employees: 2 });
      setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Planes y Límites</h2>
        <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID (Slug)</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Max Clientes</TableHead>
              <TableHead>Max Empleados</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : plans.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No hay planes definidos.</TableCell></TableRow>
            ) : (
                plans.map((plan) => (
                    <TableRow key={plan.id}>
                        <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>${plan.price}</TableCell>
                        <TableCell>{plan.max_clients >= 999999 ? '∞' : plan.max_clients}</TableCell>
                        <TableCell>{plan.max_employees >= 999999 ? '∞' : plan.max_employees}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(plan.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
                  <DialogDescription>Define los límites y características del plan.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="id">ID (Slug)</Label>
                          <Input 
                              id="id" 
                              value={formData.id} 
                              onChange={(e) => setFormData({...formData, id: e.target.value})}
                              placeholder="ej. basico-mensual"
                              disabled={!!editingId} 
                              required 
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="name">Nombre Visible</Label>
                          <Input 
                              id="name" 
                              value={formData.name} 
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="ej. Plan Básico"
                              required 
                          />
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="price">Precio Mensual ($)</Label>
                      <Input 
                          id="price" 
                          type="number" 
                          step="0.01"
                          value={formData.price} 
                          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                          required 
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="max_clients">Max Clientes</Label>
                          <Input 
                              id="max_clients" 
                              type="number" 
                              value={formData.max_clients} 
                              onChange={(e) => setFormData({...formData, max_clients: parseInt(e.target.value)})}
                              required 
                          />
                          <span className="text-xs text-muted-foreground">Usa 999999 para ilimitado</span>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="max_employees">Max Empleados</Label>
                          <Input 
                              id="max_employees" 
                              type="number" 
                              value={formData.max_employees} 
                              onChange={(e) => setFormData({...formData, max_employees: parseInt(e.target.value)})}
                              required 
                          />
                      </div>
                  </div>

                  <DialogFooter>
                      <Button type="submit">Guardar Plan</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
