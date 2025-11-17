
import { useMemo, useState, useRef } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useEjercicios } from "@/features/ejercicios/useEjercicios";
import { useRutinas } from "@/features/rutinas/useRutinas";
import { useClientes } from "@/features/clientes/useClientes";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ScrollArea } from "@/components/ui/scroll-area";

type EjercicioRow = ReturnType<typeof useEjercicios>["ejercicios"][number];
type ClienteRow = ReturnType<typeof useClientes>["clientes"][number];

// Se integra con Supabase mediante hooks

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
  const { rutinas, fetchRutinas, createRutina, getRutinaDetalle, updateRutina, deleteRutina } = useRutinas();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [ejercicioActualId, setEjercicioActualId] = useState<string | null>(null);
  const ejercicioActual = useMemo(() => ejercicios.find(e => e.id === ejercicioActualId) || null, [ejercicios, ejercicioActualId]);
  const [exNombre, setExNombre] = useState("");
  const [exCategoria, setExCategoria] = useState<string | undefined>(undefined); // ahora representa el músculo seleccionado
  const [exDescripcion, setExDescripcion] = useState("");
const [exImagenUrl, setExImagenUrl] = useState<string>("");
  const ejerciciosFiltrados = filteredEjercicios;
  const [tab, setTab] = useState<'ejercicios' | 'rutinas'>('ejercicios');
  const [musculoFiltro, setMusculoFiltro] = useState<'all' | string>('all');
  const ejerciciosFiltradosUI = useMemo(() => {
    return ejerciciosFiltrados.filter((e) => {
      if (musculoFiltro === 'all') return true;
      return (e.musculos || []).includes(musculoFiltro);
    });
  }, [ejerciciosFiltrados, musculoFiltro]);
  const [rutinaNombre, setRutinaNombre] = useState("");
  const [rutinaNotas, setRutinaNotas] = useState("");
  const [rutinaClienteId, setRutinaClienteId] = useState<string>("");
  const [rutinaDias, setRutinaDias] = useState<string[]>([]);
  const [diasPreset, setDiasPreset] = useState<'3' | '5' | 'libre' | ''>('');
  const [rutinaDetalle, setRutinaDetalle] = useState<Array<{ ejercicio_id: string; orden: number; series?: number; repeticiones?: string; tempo?: string; descanso?: string; notas?: string }>>([]);
  const [verRutinaAbierto, setVerRutinaAbierto] = useState(false);
  const [verRutinaLoading, setVerRutinaLoading] = useState(false);
  const [rutinaVista, setRutinaVista] = useState<any>(null);
  const rutinaExportRef = useRef<HTMLDivElement | null>(null);
  const [rutinaAsignaciones, setRutinaAsignaciones] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rutinaToDelete, setRutinaToDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const imageSizeClass = exporting ? 'h-20 w-20' : 'h-12 w-12';

  // Función para generar PDF con saltos de página entre días e imágenes
  const generarPDFConSaltos = async () => {
    try {
      setExporting(true);
      
      // Crear PDF con saltos de página entre días
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      
      let yPosition = margin;
      
      // Título de la rutina
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(rutinaVista?.rutina?.nombre || 'Rutina de Ejercicios', margin, yPosition);
      yPosition += 10;
      
      // Días de la rutina
      if (rutinaVista?.rutina?.dias && rutinaVista.rutina.dias.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Días: ${rutinaVista.rutina.dias.join(', ')}`, margin, yPosition);
        yPosition += 10;
      }
      
      // Notas si existen
      if (rutinaVista?.rutina?.notas) {
        pdf.setFontSize(11);
        pdf.text('Notas:', margin, yPosition);
        yPosition += 5;
        
        // Dividir notas en líneas si son largas
        const notasLines = pdf.splitTextToSize(rutinaVista.rutina.notas, contentWidth);
        pdf.text(notasLines, margin, yPosition);
        yPosition += notasLines.length * 5 + 5;
      }
      
      // Procesar ejercicios por días
      const detalle = (rutinaVista?.detalle || []) as any[];
      const tieneDia = detalle.some(d => d.dia);
      
      // Función auxiliar para cargar imágenes
      const cargarImagen = (url: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Establecer fondo blanco
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              // Dibujar la imagen encima del fondo blanco
              ctx.drawImage(img, 0, 0, 80, 60);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              resolve('');
            }
          };
          img.onerror = () => resolve('');
          img.src = url;
        });
      };
      
      if (tieneDia) {
        // Agrupar por días
        const grupos: Record<string, any[]> = {};
        for (const it of detalle) {
          const key = String(it.dia || '1');
          if (!grupos[key]) grupos[key] = [];
          grupos[key].push(it);
        }
        
        const diasOrdenados = Object.keys(grupos).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        
        for (let diaIndex = 0; diaIndex < diasOrdenados.length; diaIndex++) {
          const diaKey = diasOrdenados[diaIndex];
          
          // Salto de página para cada día (excepto el primero)
          if (diaIndex > 0) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Título del día
          pdf.setFontSize(16);
          pdf.setFont(undefined, 'bold');
          pdf.text(`Día ${diaKey}`, margin, yPosition);
          yPosition += 15;
          
          // Ejercicios del día
          const ejerciciosDia = grupos[diaKey];
          
          for (let ejIndex = 0; ejIndex < ejerciciosDia.length; ejIndex++) {
            const item = ejerciciosDia[ejIndex];
            const ejercicio = item.ejercicios;
            if (!ejercicio) continue;
            
            // Calcular espacio necesario para este ejercicio
            let espacioNecesario = 30; // Espacio base para imagen + detalles básicos
            if (ejercicio.descripcion) {
              const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
              espacioNecesario += descLines.length * 4 + 5;
            }
            
            // Verificar si necesitamos nueva página
            if (yPosition + espacioNecesario > pageHeight - 20) {
              pdf.addPage();
              yPosition = margin;
            }
            
            // Cargar y agregar imagen si existe
            if (ejercicio.imagen_url) {
              try {
                const imgData = await cargarImagen(ejercicio.imagen_url);
                if (imgData) {
                  pdf.addImage(imgData, 'JPEG', margin, yPosition, 25, 20);
                }
              } catch (error) {
                console.warn('Error al cargar imagen:', error);
              }
            }
            
            // Nombre del ejercicio (a la derecha de la imagen)
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${ejIndex + 1}. ${ejercicio.nombre}`, margin + 30, yPosition + 7);
            
            // Detalles del ejercicio
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            
            const detalles = [];
            if (item.series) detalles.push(`Series: ${item.series}`);
            if (item.repeticiones) detalles.push(`Reps: ${item.repeticiones}`);
            if (item.tempo) detalles.push(`Tempo: ${item.tempo}`);
            if (item.descanso) detalles.push(`Descanso: ${item.descanso}`);
            
            if (detalles.length > 0) {
              pdf.text(detalles.join(' | '), margin + 30, yPosition + 15);
              yPosition += 25;
            } else {
              yPosition += 20;
            }
            
            // Descripción si existe
            if (ejercicio.descripcion) {
              const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
              pdf.text(descLines, margin + 30, yPosition);
              yPosition += descLines.length * 4 + 5;
            } else {
              yPosition += 5;
            }
            
            // Línea separadora (solo si no es el último ejercicio)
            if (ejIndex < ejerciciosDia.length - 1) {
              pdf.setDrawColor(200, 200, 200);
              pdf.line(margin, yPosition, pageWidth - margin, yPosition);
              yPosition += 8;
            }
          }
          
          // Optimizar espacio al final del día - si hay mucho espacio y es el último día, no agregar página extra
          if (diaIndex < diasOrdenados.length - 1 && yPosition > pageHeight - 150) {
            // Dejar espacio natural para el siguiente día
          }
        }
      } else {
        // Sin días, mostrar todos los ejercicios
        for (let index = 0; index < detalle.length; index++) {
          const item = detalle[index];
          const ejercicio = item.ejercicios;
          if (!ejercicio) continue;
          
          // Calcular espacio necesario para este ejercicio
          let espacioNecesario = 30; // Espacio base para imagen + detalles básicos
          if (ejercicio.descripcion) {
            const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
            espacioNecesario += descLines.length * 4 + 5;
          }
          
          // Verificar si necesitamos nueva página
          if (yPosition + espacioNecesario > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Cargar y agregar imagen si existe
          if (ejercicio.imagen_url) {
            try {
              const imgData = await cargarImagen(ejercicio.imagen_url);
              if (imgData) {
                pdf.addImage(imgData, 'JPEG', margin, yPosition, 25, 20);
              }
            } catch (error) {
              console.warn('Error al cargar imagen:', error);
            }
          }
          
          // Nombre del ejercicio
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${ejercicio.nombre}`, margin + 30, yPosition + 7);
          
          // Detalles del ejercicio
          pdf.setFontSize(11);
          pdf.setFont(undefined, 'normal');
          
          const detalles = [];
          if (item.series) detalles.push(`Series: ${item.series}`);
          if (item.repeticiones) detalles.push(`Reps: ${item.repeticiones}`);
          if (item.tempo) detalles.push(`Tempo: ${item.tempo}`);
          if (item.descanso) detalles.push(`Descanso: ${item.descanso}`);
          
          if (detalles.length > 0) {
            pdf.text(detalles.join(' | '), margin + 30, yPosition + 15);
            yPosition += 25;
          } else {
            yPosition += 20;
          }
          
          // Descripción si existe
          if (ejercicio.descripcion) {
            const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
            pdf.text(descLines, margin + 30, yPosition);
            yPosition += descLines.length * 4 + 5;
          } else {
            yPosition += 5;
          }
          
          // Línea separadora (solo si no es el último ejercicio)
          if (index < detalle.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
          }
        }
      }
      
      const nombre = (rutinaVista?.rutina?.nombre || 'rutina').replace(/\s+/g, '_');
      const fecha = new Date().toISOString().slice(0, 10);
      pdf.save(`${nombre}_${fecha}.pdf`);
      
    } catch (err) {
      console.error('Error exportando PDF', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo exportar la rutina a PDF.' });
    } finally {
      setExporting(false);
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
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteEjercicio(ejercicio.id)}>
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
              <CardTitle>Crear Rutina</CardTitle>
              <CardDescription>Define la rutina y asigna ejercicios al cliente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="rutina-nombre">Nombre</Label>
                  <Input id="rutina-nombre" className="h-9 text-sm" value={rutinaNombre} onChange={(e) => setRutinaNombre(e.target.value)} placeholder="Ej. Rutina fuerza superior" />
                </div>
                <div className="grid gap-2">
                  <Label>Días</Label>
                  <Select
                    value={diasPreset}
                    onValueChange={(v) => {
                      setDiasPreset(v as '3' | '5' | 'libre');
                      if (v === '3') {
                        setRutinaDias(['Lunes', 'Miércoles', 'Viernes']);
                      } else if (v === '5') {
                        setRutinaDias(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
                      } else if (v === 'libre') {
                        setRutinaDias([]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecciona 3 días, 5 días o Libre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 días</SelectItem>
                      <SelectItem value="5">5 días</SelectItem>
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
                        <div key={dia} className="space-y-2">
                          <div className="font-semibold">Día {dia}</div>
                          {(rutinaDetalle.filter(d => (d.dia || '1') === dia)).map((item, _idx) => {
                            const ej = ejercicios.find(e => e.id === item.ejercicio_id);
                            const idx = rutinaDetalle.findIndex(d => d === item);
                            return (
                              <div key={`dia-${dia}-idx-${idx}`} className="grid md:grid-cols-6 gap-2 items-end">
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
                            {/* Campo Orden eliminado por simplicidad */}
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
                                <SelectTrigger>
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
                          <Button variant="outline" className="gap-2" onClick={() => setRutinaDetalle([...rutinaDetalle, { ejercicio_id: '', orden: rutinaDetalle.length+1, dia }])}>
                            <Plus className="h-4 w-4" /> Añadir ejercicio al Día {dia}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {rutinaDetalle.map((item, idx) => {
                        const ej = ejercicios.find(e => e.id === item.ejercicio_id);
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
                            {/* Campo Orden eliminado por simplicidad */}
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
              <Button variant="outline" onClick={() => { setRutinaNombre(''); setRutinaNotas(''); setRutinaClienteId(''); setRutinaDias([]); setRutinaDetalle([]); }}>Limpiar</Button>
              <Button onClick={async () => {
                if (!rutinaNombre.trim()) { toast({ variant:'destructive', title:'Datos incompletos', description:'El nombre de la rutina es requerido.' }); return; }
                try {
                  await createRutina({ nombre: rutinaNombre, cliente_id: rutinaClienteId || null, notas: rutinaNotas, dias: rutinaDias }, rutinaDetalle.filter(d => d.ejercicio_id));
                  toast({ title:'Rutina creada', description:'La rutina se guardó correctamente.' });
                  setRutinaNombre(''); setRutinaNotas(''); setRutinaClienteId(''); setRutinaDias([]); setRutinaDetalle([]);
                  fetchRutinas(rutinaClienteId || undefined);
                } catch {}
              }}>Guardar Rutina</Button>
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
                    <p>No hay rutinas para el cliente seleccionado.</p>
                    <p className="text-xs">Selecciona un cliente o crea una nueva rutina.</p>
                  </div>
                )}
                {rutinas.map((r) => (
                  <Card key={r.id} className="border">
                    <CardHeader>
                      <CardTitle>{r.nombre}</CardTitle>
                      <CardDescription>{(r.dias || []).join(', ')}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col md:flex-row md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={rutinaAsignaciones[r.id] ?? (r.cliente_id || 'none')}
                          onValueChange={(v) => setRutinaAsignaciones(prev => ({ ...prev, [r.id]: v }))}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Asignar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin cliente</SelectItem>
                            {clientes.map((c: ClienteRow) => (
                              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const selected = rutinaAsignaciones[r.id] ?? 'none';
                            try {
                              await updateRutina(r.id, { cliente_id: selected === 'none' ? null : selected });
                              toast({ title: 'Rutina asignada', description: 'La rutina fue asignada correctamente.' });
                              fetchRutinas(rutinaClienteId || undefined);
                            } catch {}
                          }}
                        >
                          Asignar
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
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
                          onClick={() => { setRutinaToDelete(r.id); setConfirmDeleteOpen(true); }}
                          aria-label="Eliminar rutina"
                          title="Eliminar rutina"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

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
                                {/* Campos Tempo y Descanso ocultos en la vista */}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      const grupos: Record<string, any[]> = {};
                      for (const it of detalle) {
                        const key = String(it.dia || '1');
                        if (!grupos[key]) grupos[key] = [];
                        grupos[key].push(it);
                      }
                      const diasOrdenados = Object.keys(grupos).sort((a,b) => parseInt(a,10)-parseInt(b,10));
                      return (
                        <div className="space-y-4 mt-2">
                          {diasOrdenados.map((diaKey) => (
                            <div key={diaKey} className="space-y-2">
                              <div className="font-semibold">Día {diaKey}</div>
                              <div className="space-y-3">
                                {grupos[diaKey].map((item: any, idx: number) => (
                                  <div key={`v-${diaKey}-${idx}`} className="grid md:grid-cols-4 gap-2 items-center">
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
                                    {/* Campos Tempo y Descanso ocultos en la vista */}
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
                    onClick={generarPDFConSaltos}
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
                      fetchRutinas(rutinaClienteId || undefined);
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
    </div>
  );
}

function ExerciseCombobox({
  value,
  options,
  onChange,
}: {
  value: string | null | undefined;
  options: EjercicioRow[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  const label = selected?.nombre || "Seleccionar ejercicio";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="justify-between w-full">
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Buscar ejercicio..." />
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.nombre}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                >
                  {e.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
