
import { useState } from "react";
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  PlayCircle,
  Heart,
  Scan,
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Tipos para los ejercicios
interface Ejercicio {
  id: string;
  nombre: string;
  categoria: string;
  dificultad: string;
  musculos: string[];
  descripcion: string;
  imagen: string;
}

// Datos de ejemplo
const ejerciciosIniciales: Ejercicio[] = [
  {
    id: "1",
    nombre: "Press de Banca",
    categoria: "fuerza",
    dificultad: "intermedio",
    musculos: ["pecho", "triceps", "hombros"],
    descripcion: "El press de banca es un ejercicio compuesto para desarrollar la parte superior del cuerpo.",
    imagen: "/placeholder.svg",
  },
  {
    id: "2",
    nombre: "Sentadillas",
    categoria: "fuerza",
    dificultad: "principiante",
    musculos: ["cuadriceps", "gluteos", "isquiotibiales"],
    descripcion: "Las sentadillas son un ejercicio básico para fortalecer las piernas y glúteos.",
    imagen: "/placeholder.svg",
  },
  {
    id: "3",
    nombre: "Peso Muerto",
    categoria: "fuerza",
    dificultad: "avanzado",
    musculos: ["espalda", "gluteos", "isquiotibiales"],
    descripcion: "El peso muerto es un ejercicio compuesto que trabaja casi todos los músculos del cuerpo.",
    imagen: "/placeholder.svg",
  },
  {
    id: "4",
    nombre: "Burpees",
    categoria: "cardio",
    dificultad: "intermedio",
    musculos: ["full-body"],
    descripcion: "Los burpees son un ejercicio de cuerpo completo de alta intensidad.",
    imagen: "/placeholder.svg",
  },
  {
    id: "5",
    nombre: "Plancha",
    categoria: "core",
    dificultad: "principiante",
    musculos: ["abdominales", "espalda baja"],
    descripcion: "La plancha es un ejercicio isométrico que fortalece el core y mejora la estabilidad.",
    imagen: "/placeholder.svg",
  },
  {
    id: "6",
    nombre: "Dominadas",
    categoria: "fuerza",
    dificultad: "avanzado",
    musculos: ["espalda", "biceps", "antebrazos"],
    descripcion: "Las dominadas son un ejercicio excelente para desarrollar la fuerza de la parte superior del cuerpo.",
    imagen: "/placeholder.svg",
  },
];

const coloresCategorias: { [key: string]: string } = {
  fuerza: "bg-blue-100 text-blue-800",
  cardio: "bg-red-100 text-red-800",
  flexibilidad: "bg-green-100 text-green-800",
  core: "bg-purple-100 text-purple-800",
  equilibrio: "bg-yellow-100 text-yellow-800",
};

const coloresDificultad: { [key: string]: string } = {
  principiante: "bg-green-100 text-green-800",
  intermedio: "bg-yellow-100 text-yellow-800",
  avanzado: "bg-red-100 text-red-800",
};

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>(ejerciciosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [ejercicioActual, setEjercicioActual] = useState<Ejercicio | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  
  // Funciones CRUD
  const agregarEjercicio = (ejercicio: Omit<Ejercicio, "id">) => {
    const nuevoEjercicio = {
      ...ejercicio,
      id: Date.now().toString(),
    };
    setEjercicios([...ejercicios, nuevoEjercicio]);
  };
  
  const editarEjercicio = (ejercicio: Ejercicio) => {
    setEjercicioActual(ejercicio);
    setDialogoAbierto(true);
  };
  
  const actualizarEjercicio = (ejercicioActualizado: Ejercicio) => {
    setEjercicios(
      ejercicios.map((ej) =>
        ej.id === ejercicioActualizado.id ? ejercicioActualizado : ej
      )
    );
    setDialogoAbierto(false);
    setEjercicioActual(null);
  };
  
  const eliminarEjercicio = (id: string) => {
    setEjercicios(ejercicios.filter((ej) => ej.id !== id));
  };
  
  // Filtrado de ejercicios
  const ejerciciosFiltrados = ejercicios.filter((ejercicio) =>
    ejercicio.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    ejercicio.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
    ejercicio.musculos.some(musculo => 
      musculo.toLowerCase().includes(busqueda.toLowerCase())
    )
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ejercicios</h2>
          <p className="text-muted-foreground">
            Gestiona tu biblioteca de ejercicios
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Ejercicio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {ejercicioActual ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}
              </DialogTitle>
              <DialogDescription>
                Completa los detalles del ejercicio a continuación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" placeholder="Nombre del ejercicio" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuerza">Fuerza</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibilidad">Flexibilidad</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="equilibrio">Equilibrio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dificultad">Dificultad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="musculos">Músculos trabajados</Label>
                <Input id="musculos" placeholder="pecho, brazos, etc." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" placeholder="Describe el ejercicio y cómo realizarlo correctamente" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imagen">Imagen</Label>
                <Input id="imagen" type="file" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar ejercicios..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="fuerza">Fuerza</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibilidad">Flexibilidad</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="equilibrio">Equilibrio</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ejerciciosFiltrados.map((ejercicio) => (
          <Card key={ejercicio.id}>
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 space-x-1">
                <Button variant="ghost" size="icon" onClick={() => editarEjercicio(ejercicio)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => eliminarEjercicio(ejercicio.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-muted p-2">
                  <Dumbbell className="h-5 w-5 text-gym-blue" />
                </div>
                <div>
                  <CardTitle>{ejercicio.nombre}</CardTitle>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className={coloresCategorias[ejercicio.categoria] || "bg-gray-100"}>
                  {ejercicio.categoria}
                </Badge>
                <Badge className={coloresDificultad[ejercicio.dificultad] || "bg-gray-100"}>
                  {ejercicio.dificultad}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                <img 
                  src={ejercicio.imagen} 
                  alt={ejercicio.nombre} 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {ejercicio.descripcion}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {ejercicio.musculos.map((musculo, index) => (
                  <Badge key={index} variant="outline">
                    {musculo}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Ver Demo
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
