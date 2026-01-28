import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type Empleado = {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  permisos: string[];
};

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "asistencia", label: "Asistencia" },
  { id: "clientes", label: "Clientes" },
  { id: "rutinas", label: "Rutinas/Ejercicios" },
  { id: "membresias", label: "Membresías" },
  { id: "pagos", label: "Pagos" },
  { id: "calendario", label: "Calendario" },
  { id: "anuncios", label: "Anuncios" },
  { id: "perfil", label: "Perfil" },
];

export default function Empleados() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permisos, setPermisos] = useState<string[]>([]);

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los empleados.",
      });
    } else {
      setEmpleados(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setPassword("");
    setPermisos([]);
    setEditingId(null);
  };

  const handleOpenDialog = (empleado?: Empleado) => {
    if (empleado) {
      setEditingId(empleado.id);
      setNombre(empleado.nombre);
      setEmail(empleado.email);
      setPassword(empleado.password || "");
      setPermisos(empleado.permisos || []);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nombre || !email || !password) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor completa nombre, email y contraseña.",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("empleados")
          .update({
            nombre,
            email,
            password,
            permisos,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Empleado actualizado", description: "Los datos se guardaron correctamente." });
      } else {
        const { error } = await supabase
          .from("empleados")
          .insert([
            {
              nombre,
              email,
              password,
              permisos,
            },
          ]);

        if (error) throw error;
        toast({ title: "Empleado creado", description: "El nuevo empleado ha sido registrado." });
      }
      setDialogOpen(false);
      fetchEmpleados();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el empleado.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este empleado?")) return;

    try {
      const { error } = await supabase.from("empleados").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Empleado eliminado" });
      fetchEmpleados();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el empleado.",
      });
    }
  };

  const togglePermiso = (id: string) => {
    setPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>
          <p className="text-muted-foreground">
            Gestiona el acceso del personal al sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Empleado
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : empleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay empleados registrados.
                </TableCell>
              </TableRow>
            ) : (
              empleados.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.nombre}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(emp.permisos || []).map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                          {AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label || p}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(emp)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleDelete(emp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Empleado" : "Nuevo Empleado"}
            </DialogTitle>
            <DialogDescription>
              Configura los datos de acceso y permisos del empleado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@fitgym.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de acceso"
              />
            </div>
            <div className="grid gap-2">
              <Label className="mb-2">Permisos de Acceso</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((permiso) => (
                  <div key={permiso.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permiso-${permiso.id}`}
                      checked={permisos.includes(permiso.id)}
                      onCheckedChange={() => togglePermiso(permiso.id)}
                    />
                    <Label
                      htmlFor={`permiso-${permiso.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {permiso.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
