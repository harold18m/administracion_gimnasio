import { useMemo, useState, useRef } from "react";
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  PlayCircle,
  Heart,
  Scan,
  Zap,
  Copy,
  Users
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useEjercicios } from "@/features/ejercicios/useEjercicios";
import { useRutinas } from "@/features/rutinas/useRutinas";
import { useClientes } from "@/features/clientes/useClientes";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateRoutinePDF } from "@/utils/pdfGenerator";
import { ExerciseCombobox } from "@/components/ExerciseCombobox";
import { ClientCombobox } from "@/components/ClientCombobox";

type EjercicioRow = ReturnType<typeof useEjercicios>["ejercicios"][number];
type ClienteRow = ReturnType<typeof useClientes>["clientes"][number];

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

export default function Rutinas() {
  const { toast } = useToast();
  const { ejercicios, filteredEjercicios, busqueda, setBusqueda, createEjercicio, updateEjercicio, deleteEjercicio } = useEjercicios();
  const { clientes } = useClientes();
  const { rutinas, fetchRutinas, createRutina, getRutinaDetalle, updateRutina, deleteRutina, updateRutinaCompleta } = useRutinas();
  
  // States - Ejercicios
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [ejercicioActualId, setEjercicioActualId] = useState<string | null>(null);
  const ejercicioActual = useMemo(() => ejercicios.find(e => e.id === ejercicioActualId) || null, [ejercicios, ejercicioActualId]);
  const [exNombre, setExNombre] = useState("");
  const [exCategoria, setExCategoria] = useState<string | undefined>(undefined); 
  const [exDescripcion, setExDescripcion] = useState("");
  const [exImagenUrl, setExImagenUrl] = useState<string>("");
  
  // Filters
  const ejerciciosFiltrados = filteredEjercicios;
  const [tab, setTab] = useState<'ejercicios' | 'rutinas'>('ejercicios');
  const [musculoFiltro, setMusculoFiltro] = useState<'all' | string>('all');
  const ejerciciosFiltradosUI = useMemo(() => {
    return ejerciciosFiltrados.filter((e) => {
      if (musculoFiltro === 'all') return true;
      return (e.musculos || []).includes(musculoFiltro);
    });
  }, [ejerciciosFiltrados, musculoFiltro]);

  // States - Rutinas Editor
  const [rutinaNombre, setRutinaNombre] = useState("");
  const [rutinaNotas, setRutinaNotas] = useState("");
  const [rutinaClienteId, setRutinaClienteId] = useState<string>("none");
  const [rutinaDias, setRutinaDias] = useState<string[]>([]);
  const [diasPreset, setDiasPreset] = useState<'3' | '5' | 'libre' | ''>('');
  const [rutinaDetalle, setRutinaDetalle] = useState<Array<{ ejercicio_id: string; orden: number; series?: number; repeticiones?: string; tempo?: string; descanso?: string; notas?: string; dia?: string | null }>>([]);
  const [editingRutinaId, setEditingRutinaId] = useState<string | null>(null);
  
  // States - Rutina View/Export
  const [verRutinaAbierto, setVerRutinaAbierto] = useState(false);
  const [verRutinaLoading, setVerRutinaLoading] = useState(false);
  const [rutinaVista, setRutinaVista] = useState<any>(null);
  const rutinaExportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // States - Actions
  const [rutinaAsignaciones, setRutinaAsignaciones] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rutinaToDelete, setRutinaToDelete] = useState<string | null>(null);
  
  // State - Duplicate
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [targetDuplicateClient, setTargetDuplicateClient] = useState<string>("none");
  const [rutinaToDuplicate, setRutinaToDuplicate] = useState<string | null>(null);
  
  // State - Confirm Delete Exercise
  const [confirmExerciseDeleteOpen, setConfirmExerciseDeleteOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

  const imageSizeClass = exporting ? 'h-20 w-20' : 'h-12 w-12';

  // --- Handlers Ejercicios ---
  const abrirNuevoEjercicio = () => {
    setEjercicioActualId(null);
    setExNombre(""); setExCategoria(undefined);
    setExDescripcion(""); setExImagenUrl("");
    setDialogoAbierto(true);
  };
  
  const abrirEditarEjercicio = (id: string) => {
    setEjercicioActualId(id);
    const ej = ejercicios.find(e => e.id === id);
    setExNombre(ej?.nombre || "");
    setExCategoria((ej?.musculos && ej.musculos[0]) || undefined);
    setExDescripcion(ej?.descripcion || "");
    setExImagenUrl(ej?.imagen_url || "");
    setDialogoAbierto(true);
  };

  const guardarEjercicio = async () => {
    if (!exNombre.trim()) { toast({ variant:'destructive', title:'Nombre requerido', description:'Ingresa el nombre del ejercicio' }); return; }
    try {
      if (!ejercicioActual) {
        await createEjercicio({ nombre: exNombre, categoria: null, musculos: exCategoria ? [exCategoria] : [], descripcion: exDescripcion || null, imagen_url: exImagenUrl || undefined });
      } else {
        await updateEjercicio(ejercicioActual.id, { nombre: exNombre, categoria: null, musculos: exCategoria ? [exCategoria] : [], descripcion: exDescripcion || null, imagen_url: exImagenUrl || undefined });
      }
      setDialogoAbierto(false);
      setEjercicioActualId(null);
      toast({ title: 'Ejercicio guardado', description: 'El ejercicio se guardó correctamente.' });
    } catch {}
  };

  // --- Handlers Rutinas ---

  const handleDiasPresetChange = (v: string) => {
      setDiasPreset(v as any);
      if (v === '3') {
          setRutinaDias(['Lunes', 'Miércoles', 'Viernes']);
      } else if (v === '5') {
          setRutinaDias(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
      } else if (v === 'libre') {
          setRutinaDias([]);
      }
  };

  const handleSaveRutina = async () => {
      if (!rutinaNombre.trim()) { toast({ variant:'destructive', title:'Datos incompletos', description:'El nombre de la rutina es requerido.' }); return; }
      
      const clienteFinal = rutinaClienteId === "none" ? null : rutinaClienteId;
      
      // Mapear dias índice a nombres si es necesario (para preset 3 o 5 días, los selects devuelven "1", "2")
      // Sin embargo, si usamos el preset, rutinaDias ya tiene ["Lunes", ...]
      // El problema es rutinaDetalle[].dia. Si es preset, la UI usa indices 1, 2, 3.
      // Debemos mapear esos indices a los nombres reales en rutinaDias.
      
      const detalleFinal = rutinaDetalle.map(d => {
          if (!d.ejercicio_id) return null;
          let diaNombre = d.dia;
          if ((diasPreset === '3' || diasPreset === '5') && d.dia && !isNaN(parseInt(d.dia))) {
              // d.dia trae "1", "2", etc.
              const idx = parseInt(d.dia) - 1;
              if (rutinaDias[idx]) {
                  diaNombre = rutinaDias[idx];
              }
          }
          return {
              ...d,
              dia: diaNombre
          };
      }).filter(d => d !== null) as any[];

      try {
        if (editingRutinaId) {
          await updateRutinaCompleta(
            editingRutinaId,
            { nombre: rutinaNombre, cliente_id: clienteFinal, notas: rutinaNotas, dias: rutinaDias },
            detalleFinal
          );
          toast({ title:'Rutina actualizada', description:'La rutina se actualizó correctamente.' });
        } else {
          await createRutina({ nombre: rutinaNombre, cliente_id: clienteFinal, notas: rutinaNotas, dias: rutinaDias }, detalleFinal);
          toast({ title:'Rutina creada', description:'La rutina se guardó correctamente.' });
        }
        // Reset
        setRutinaNombre(''); setRutinaNotas(''); setRutinaClienteId('none'); setRutinaDias([]); setRutinaDetalle([]); setEditingRutinaId(null); setDiasPreset('');
        fetchRutinas();
      } catch {}
  };

  const handleEditRutina = async (rId: string) => {
      try {
          const res = await getRutinaDetalle(rId);
          setEditingRutinaId(rId);
          setTab('rutinas');
          setRutinaNombre(res.rutina.nombre || '');
          setRutinaNotas(res.rutina.notas || '');
          setRutinaClienteId(res.rutina.cliente_id || 'none');
          setRutinaDias(res.rutina.dias || []);
          
          let preset = 'libre';
          if (Array.isArray(res.rutina.dias)) {
            const d = res.rutina.dias;
            if (d.join(',') === ['Lunes','Miércoles','Viernes'].join(',')) preset = '3';
            else if (d.join(',') === ['Lunes','Martes','Miércoles','Jueves','Viernes'].join(',')) preset = '5';
          }
          setDiasPreset(preset as any);

          // Si es preset, la UI espera indices "1", "2" en d.dia, pero la BD tiene nombres "Lunes"
          // Mapear inverse: "Lunes" -> "1"
          const mappedDetalle = (res.detalle || []).map((it: any, idx: number) => {
              let diaVal = it.dia;
              if (preset === '3' || preset === '5') {
                  const diaIdx = res.rutina.dias?.indexOf(it.dia || '');
                  if (diaIdx !== undefined && diaIdx !== -1) {
                      diaVal = (diaIdx + 1).toString();
                  }
              }
              return {
                  ejercicio_id: it.ejercicio_id,
                  orden: it.orden ?? (idx + 1),
                  series: it.series ?? undefined,
                  repeticiones: it.repeticiones ?? undefined,
                  tempo: it.tempo ?? undefined,
                  descanso: it.descanso ?? undefined,
                  notas: it.notas ?? undefined,
                  dia: diaVal,
              };
          });

          setRutinaDetalle(mappedDetalle as any);
          toast({ title: 'Edición de rutina', description: 'Cargada para edición.' });
        } catch (e) {
            console.error(e);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la rutina para editar.' });
        }
  };

  const handleDuplicateRutina = async () => {
      if (!rutinaToDuplicate) return;
      try {
          const res = await getRutinaDetalle(rutinaToDuplicate);
          const newName = `${res.rutina.nombre} (Copia)`;
          const targetClient = targetDuplicateClient === 'none' ? null : targetDuplicateClient;
          
          // Clonar
          await createRutina(
              {
                  nombre: newName,
                  cliente_id: targetClient,
                  dias: res.rutina.dias,
                  notas: res.rutina.notas
              },
              (res.detalle || []).map((d: any) => ({
                  rutina_id: '', // será ignorado/generado
                  ejercicio_id: d.ejercicio_id,
                  orden: d.orden,
                  series: d.series,
                  repeticiones: d.repeticiones, 
                  tempo: d.tempo,
                  descanso: d.descanso,
                  notas: d.notas,
                  dia: d.dia
              }))
          );
          
          toast({ title: 'Rutina duplicada', description: `Se creó una copia asignada correctamente.` });
          setDuplicateDialogOpen(false);
          setRutinaToDuplicate(null);
          setTargetDuplicateClient('none');
          fetchRutinas();
      } catch (err) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo duplicar la rutina.' });
      }
  };

  const waitImagesLoaded = async (node?: HTMLDivElement | null) => {
    if (!node) return;
    const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map((img) => {
        if ((img as any).decode) {
          try { return (img as any).decode(); } catch { /* fallback below */ }
        }
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      })
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rutinas</h2>
          <p className="text-muted-foreground">
            Gestiona tus rutinas y biblioteca de ejercicios
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={abrirNuevoEjercicio}>
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
                <Input id="nombre" placeholder="Nombre del ejercicio" value={exNombre} onChange={(e) => setExNombre(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="musculo">Músculo</Label>
                  <Select value={exCategoria} onValueChange={(v) => setExCategoria(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cuadriceps">Cuádriceps</SelectItem>
                      <SelectItem value="femoral">Femoral</SelectItem>
                      <SelectItem value="pecho">Pecho</SelectItem>
                      <SelectItem value="espalda">Espalda</SelectItem>
                      <SelectItem value="biceps">Bíceps</SelectItem>
                      <SelectItem value="triceps">Tríceps</SelectItem>
                      <SelectItem value="abdomen">Abdomen</SelectItem>
                      <SelectItem value="hombros">Hombros</SelectItem>
                      <SelectItem value="gluteo">Glúteo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" placeholder="Describe el ejercicio y cómo realizarlo correctamente" value={exDescripcion} onChange={(e) => setExDescripcion(e.target.value)} />
              </div>
              <div className="grid gap-2">
                {ejercicioActual?.imagen_url && (
                  <img src={ejercicioActual.imagen_url} alt="Imagen actual" className="mt-1 h-24 w-24 object-contain rounded bg-muted" />
                )}
                <Label htmlFor="imagenUrl" className="mt-2">Imagen URL (opcional)</Label>
                <Input id="imagenUrl" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={exImagenUrl} onChange={(e) => setExImagenUrl(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarEjercicio}>Guardar</Button>
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
        <Button variant="outline" className="gap-2" onClick={() => setTab('ejercicios')}>
          Ejercicios
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setTab('rutinas')}>
          Rutinas
        </Button>
        <Select value={musculoFiltro} onValueChange={setMusculoFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Músculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="cuadriceps">cuadriceps</SelectItem>
            <SelectItem value="femoral">femoral</SelectItem>
            <SelectItem value="pecho">pecho</SelectItem>
            <SelectItem value="espalda">espalda</SelectItem>
            <SelectItem value="biceps">biceps</SelectItem>
            <SelectItem value="triceps">triceps</SelectItem>
            <SelectItem value="abdomen">abdomen</SelectItem>
            <SelectItem value="hombros">hombros</SelectItem>
            <SelectItem value="gluteo">gluteo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {tab === 'ejercicios' && (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ejerciciosFiltradosUI.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Dumbbell className="h-10 w-10 mb-2" />
            <p>No hay ejercicios aún. Crea el primero para empezar.</p>
            <Button className="mt-3" onClick={abrirNuevoEjercicio}>Nuevo Ejercicio</Button>
          </div>
        )}
        {ejerciciosFiltradosUI.map((ejercicio) => (
          <Card key={ejercicio.id}>
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 space-x-1">
                <Button variant="ghost" size="icon" onClick={() => abrirEditarEjercicio(ejercicio.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setExerciseToDelete(ejercicio.id); setConfirmExerciseDeleteOpen(true); }}>
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
                <Badge className={coloresCategorias[ejercicio.categoria || ''] || "bg-gray-100"}>
                  {ejercicio.categoria}
                </Badge>
                <Badge className={coloresDificultad[ejercicio.dificultad || ''] || "bg-gray-100"}>
                  {ejercicio.dificultad}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                <img
                  src={ejercicio.imagen_url || '/placeholder.svg'}
                  alt={ejercicio.nombre}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    console.warn('Imagen no cargó, usando placeholder:', ejercicio.imagen_url);
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {ejercicio.descripcion}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(ejercicio.musculos || []).map((musculo, index) => (
                  <Badge key={index} variant="outline">
                    {musculo}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="gap-2" onClick={() => { setTab('rutinas'); setRutinaDetalle([...rutinaDetalle, { ejercicio_id: ejercicio.id, orden: rutinaDetalle.length + 1 }]); }}>
                <PlayCircle className="h-4 w-4" />
                Añadir a rutina
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
      )}

      {tab === 'rutinas' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingRutinaId ? "Editar Rutina" : "Crear Rutina"}</CardTitle>
              <CardDescription>Define la rutina y asigna ejercicios al cliente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="rutina-nombre">Nombre</Label>
                  <Input id="rutina-nombre" className="h-9 text-sm" value={rutinaNombre} onChange={(e) => setRutinaNombre(e.target.value)} placeholder="Ej. Rutina fuerza superior" />
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="rutina-cliente">Asignar a Cliente</Label>
                    <ClientCombobox
                        value={rutinaClienteId}
                        options={clientes}
                        onChange={setRutinaClienteId}
                        placeholder="Seleccionar Cliente (Opcional)"
                    />
                </div>

                <div className="grid gap-2">
                  <Label>Plan de Días</Label>
                  <Select
                    value={diasPreset}
                    onValueChange={handleDiasPresetChange}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecciona 3 días, 5 días o Libre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 días (L-X-V)</SelectItem>
                      <SelectItem value="5">5 días (L-M-X-J-V)</SelectItem>
                      <SelectItem value="libre">Libre</SelectItem>
                    </SelectContent>
                  </Select>
                  {diasPreset === 'libre' && (
                    <Input
                      className="h-9 text-sm mt-2"
                      placeholder="Escribe días separados por coma. Ej.: Lunes, Miércoles, Viernes"
                      value={rutinaDias.join(', ')}
                      onChange={(e) => setRutinaDias(
                        e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea className="text-sm" rows={3} placeholder="Indicaciones generales de la rutina" value={rutinaNotas} onChange={(e) => setRutinaNotas(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Ejercicios</Label>
                <div className="space-y-2">
                  {diasPreset === '3' || diasPreset === '5' ? (
                    <div className="space-y-4">
                      {Array.from({ length: diasPreset === '3' ? 3 : 5 }, (_, i) => `${i+1}`).map((dia) => (
                        <div key={dia} className="space-y-2 border rounded-md p-3 bg-muted/20">
                          <div className="font-semibold text-sm flex items-center gap-2">
                              {/* Display actual day name if available */}
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {rutinaDias[parseInt(dia)-1] || `Día ${dia}`}
                              </span>
                          </div>
                          {(rutinaDetalle.filter(d => (d.dia || '1') === dia)).map((item, _idx) => {
                            const idx = rutinaDetalle.findIndex(d => d === item);
                            return (
                              <div key={`dia-${dia}-idx-${idx}`} className="grid md:grid-cols-6 gap-2 items-end bg-card p-2 rounded border">
                                <div className="md:col-span-2">
                                  <ExerciseCombobox
                                    value={item.ejercicio_id}
                                    options={ejercicios}
                                    onChange={(v) => {
                                      setRutinaDetalle(prev => {
                                        const next = [...prev];
                                        next[idx].ejercicio_id = v;
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                            <Input className="h-9 text-sm" type="number" placeholder="Series" value={item.series ?? ''} onChange={(e) => {
                              const val = e.target.value;
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                const parsed = val === '' ? undefined : parseInt(val, 10);
                                next[idx].series = Number.isNaN(parsed) ? undefined : parsed;
                                return next;
                              });
                            }} />
                            <Input className="h-9 text-sm" placeholder="Reps" value={item.repeticiones ?? ''} onChange={(e) => {
                              const val = e.target.value;
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                next[idx].repeticiones = val;
                                return next;
                              });
                            }} />
                            <Select value={item.dia || dia} onValueChange={(v) => {
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                next[idx].dia = v;
                                return next;
                              });
                              }}>
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Día" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: diasPreset === '3' ? 3 : 5 }, (_, i) => `${i+1}`).map(d => (
                                    <SelectItem key={d} value={d}>Día {d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                                <Button
                                  className="h-9 w-9 p-0"
                                  variant="destructive"
                                  onClick={() => { const next=[...rutinaDetalle]; next.splice(idx,1); setRutinaDetalle(next); }}
                                  aria-label="Quitar ejercicio"
                                  title="Quitar ejercicio"
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            );
                          })}
                          <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={() => setRutinaDetalle([...rutinaDetalle, { ejercicio_id: '', orden: rutinaDetalle.length+1, dia }])}>
                            <Plus className="h-3 w-3" /> Añadir ejercicio
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {rutinaDetalle.map((item, idx) => {
                        return (
                          <div key={idx} className="grid md:grid-cols-6 gap-2 items-end">
                            <div className="md:col-span-2">
                              <ExerciseCombobox
                                value={item.ejercicio_id}
                                options={ejercicios}
                                onChange={(v) => {
                                  setRutinaDetalle(prev => {
                                    const next = [...prev];
                                    next[idx].ejercicio_id = v;
                                    return next;
                                  });
                                }}
                              />
                            </div>
                            <Input className="h-9 text-sm" type="number" placeholder="Series" value={item.series ?? ''} onChange={(e) => {
                              const val = e.target.value;
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                const parsed = val === '' ? undefined : parseInt(val, 10);
                                next[idx].series = Number.isNaN(parsed) ? undefined : parsed;
                                return next;
                              });
                            }} />
                            <Input className="h-9 text-sm" placeholder="Reps" value={item.repeticiones ?? ''} onChange={(e) => {
                              const val = e.target.value;
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                next[idx].repeticiones = val;
                                return next;
                              });
                            }} />
                            <Input className="h-9 text-sm" placeholder="Día (opcional)" value={item.dia ?? ''} onChange={(e) => {
                              const val = e.target.value;
                              setRutinaDetalle(prev => {
                                const next = [...prev];
                                next[idx].dia = val || null;
                                return next;
                              });
                            }} />
                            <Button
                              className="h-9 w-9 p-0"
                              variant="destructive"
                              onClick={() => { const next=[...rutinaDetalle]; next.splice(idx,1); setRutinaDetalle(next); }}
                              aria-label="Quitar ejercicio"
                              title="Quitar ejercicio"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button variant="outline" className="gap-2" onClick={() => setRutinaDetalle([...rutinaDetalle, { ejercicio_id: '', orden: rutinaDetalle.length+1 }])}>
                        <Plus className="h-4 w-4" /> Añadir ejercicio
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRutinaNombre(''); setRutinaNotas(''); setRutinaClienteId('none'); setRutinaDias([]); setRutinaDetalle([]); setEditingRutinaId(null); setDiasPreset('libre'); }}>Limpiar</Button>
              <Button onClick={handleSaveRutina}>{editingRutinaId ? "Actualizar Rutina" : "Guardar Rutina"}</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rutinas existentes</CardTitle>
              <CardDescription>Todas las rutinas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {rutinas.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Zap className="h-8 w-8 mb-2" />
                    <p>No hay rutinas registradas.</p>
                  </div>
                )}
                {rutinas.map((r) => (
                  <Card key={r.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                         <CardTitle className="text-lg">{r.nombre}</CardTitle>
                         {r.cliente_id && (
                             <Badge variant="secondary" className="gap-1">
                                 <Users className="h-3 w-3" />
                                 {clientes.find(c => c.id === r.cliente_id)?.nombre || 'Cliente elim.'}
                             </Badge>
                         )}
                      </div>
                      <CardDescription className="line-clamp-1">{(r.dias || []).join(', ')}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-2 pt-0">
                      <div className="flex gap-2 w-full justify-between items-center">
                        <div className="flex gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditRutina(r.id)}
                            >
                                <Edit className="h-3 w-3 mr-1" /> Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setRutinaToDuplicate(r.id);
                                    setDuplicateDialogOpen(true);
                                }}
                            >
                                <Copy className="h-3 w-3 mr-1" /> Duplicar
                            </Button>
                        </div>
                        <div className="flex gap-1">
                            <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                setVerRutinaAbierto(true);
                                setVerRutinaLoading(true);
                                try {
                                const res = await getRutinaDetalle(r.id);
                                setRutinaVista(res);
                                } catch (err) {
                                toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el detalle de la rutina" });
                                } finally {
                                setVerRutinaLoading(false);
                                }
                            }}
                            >
                            Ver
                            </Button>
                            <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { setRutinaToDelete(r.id); setConfirmDeleteOpen(true); }}
                            >
                            <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Duplicar Rutina</DialogTitle>
                      <DialogDescription>
                          Se creará una copia exacta de la rutina. Puedes asignarla a un nuevo cliente inmediatamente.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-2 space-y-2">
                       <Label>Asignar copia a:</Label>
                       <ClientCombobox
                            value={targetDuplicateClient}
                            options={clientes}
                            onChange={setTargetDuplicateClient}
                            placeholder="Seleccionar Cliente"
                        />
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleDuplicateRutina}>Duplicar</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

          <Dialog open={verRutinaAbierto} onOpenChange={setVerRutinaAbierto}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {rutinaVista?.rutina?.nombre || "Detalle de Rutina"}
                </DialogTitle>
                <DialogDescription>
                  {(rutinaVista?.rutina?.dias || []).join(", ")}
                </DialogDescription>
              </DialogHeader>
              {verRutinaLoading ? (
                <div className="py-6 text-center text-muted-foreground">Cargando detalle...</div>
              ) : (
                <ScrollArea className="flex-1 pr-4">
                  <div ref={rutinaExportRef} className="space-y-4 bg-white p-4 rounded-md">
                  {rutinaVista?.rutina?.notas && (
                    <div>
                      <Label>Notas</Label>
                      <p className="text-sm text-muted-foreground">{rutinaVista.rutina.notas}</p>
                    </div>
                  )}
                  <div>
                    <Label>Ejercicios</Label>
                    {(() => {
                      const detalle = (rutinaVista?.detalle || []) as any[];
                      // Check real day string if possible
                      const tieneDia = detalle.some(d => d.dia);
                      
                      if (!tieneDia) {
                        return (
                          <div className="space-y-3 mt-2">
                            {detalle.map((item: any, idx: number) => (
                              <div key={idx} className="grid md:grid-cols-4 gap-2 items-center">
                                <div className="md:col-span-2 flex items-center gap-2">
                                  {item.ejercicios?.imagen_url && (
                                    <img
                                      src={item.ejercicios.imagen_url}
                                      className={`${imageSizeClass} object-contain rounded bg-muted`}
                                      crossOrigin="anonymous"
                                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{item.ejercicios?.nombre || "Ejercicio"}</div>
                                    <div className="text-xs text-muted-foreground">Orden: {item.orden}</div>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Series</Label>
                                  <div>{item.series ?? '-'}</div>
                                </div>
                                <div>
                                  <Label className="text-xs">Reps</Label>
                                  <div>{item.repeticiones ?? '-'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // Agrupar visualmente por dia
                      const grupos: Record<string, any[]> = {};
                      for (const it of detalle) {
                         // Fallback para agrupar
                        const key = String(it.dia || 'General');
                        if (!grupos[key]) grupos[key] = [];
                        grupos[key].push(it);
                      }
                      
                       // Sort days: try simple sort, usually Lunes/Martes...
                      // Si son string como Lunes, Martes, el sort alfabético no es ideal, pero funcional por ahora
                      // Mejor sería un mapeo, pero como es vista de admin, aceptable.
                      const diasOrdenados = Object.keys(grupos).sort(); 
                      
                      return (
                        <div className="space-y-4 mt-2">
                          {diasOrdenados.map((diaKey) => (
                            <div key={diaKey} className="space-y-2">
                              <div className="font-semibold bg-muted/30 p-2 rounded">{diaKey}</div>
                              <div className="space-y-3 pl-2">
                                {grupos[diaKey].map((item: any, idx: number) => (
                                  <div key={`v-${diaKey}-${idx}`} className="grid md:grid-cols-4 gap-2 items-center border-b pb-2 last:border-0">
                                    <div className="md:col-span-2 flex items-center gap-2">
                                      {item.ejercicios?.imagen_url && (
                                        <img
                                          src={item.ejercicios.imagen_url}
                                          className={`${imageSizeClass} object-contain rounded bg-muted`}
                                          crossOrigin="anonymous"
                                          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">{item.ejercicios?.nombre || "Ejercicio"}</div>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <span className="text-xs text-muted-foreground">Series: </span>
                                            <span className="text-sm font-medium">{item.series ?? '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Reps: </span>
                                            <span className="text-sm font-medium">{item.repeticiones ?? '-'}</span>
                                        </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  </div>
                </ScrollArea>
              )}
              <DialogFooter className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setExporting(true);
                        await waitImagesLoaded(rutinaExportRef.current);
                        await new Promise(r => setTimeout(r, 150));
                        const node = rutinaExportRef.current;
                        if (!node) return;
                        const canvas = await html2canvas(node, { useCORS: true, backgroundColor: '#ffffff', scale: 2 });
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const nombre = (rutinaVista?.rutina?.nombre || 'rutina').replace(/\s+/g, '_');
                        const fecha = new Date().toISOString().slice(0,10);
                        const link = document.createElement('a');
                        link.href = imgData;
                        link.download = `${nombre}_${fecha}.jpg`;
                        link.click();
                      } catch (err) {
                        console.error('Error exportando JPG', err);
                        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo exportar la rutina a JPG.' });
                      } finally {
                        setExporting(false);
                      }
                    }}
                  >
                    Descargar JPG
                  </Button>
                  <Button
                    onClick={() => generateRoutinePDF(rutinaVista, toast)}
                  >
                    Descargar PDF
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setVerRutinaAbierto(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará la rutina seleccionada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!rutinaToDelete) return;
                    try {
                      await deleteRutina(rutinaToDelete);
                      toast({ title: 'Rutina eliminada', description: 'La rutina fue eliminada correctamente.' });
                      fetchRutinas();
                    } catch {}
                    finally {
                      setConfirmDeleteOpen(false);
                      setRutinaToDelete(null);
                    }
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <AlertDialog open={confirmExerciseDeleteOpen} onOpenChange={setConfirmExerciseDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ejercicio se eliminará permanentemente de tu biblioteca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => {
                if (exerciseToDelete) {
                  deleteEjercicio(exerciseToDelete);
                  setExerciseToDelete(null);
                  toast({ title: 'Ejercicio eliminado', description: 'El ejercicio ha sido eliminado correctamente.' });
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
