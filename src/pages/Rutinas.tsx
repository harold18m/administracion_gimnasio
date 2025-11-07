
import { useMemo, useState } from "react";
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
import { useEjercicios } from "@/features/ejercicios/useEjercicios";
import { useRutinas } from "@/features/rutinas/useRutinas";
import { useClientes } from "@/features/clientes/useClientes";
import { useToast } from "@/hooks/use-toast";

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
  const { rutinas, fetchRutinas, createRutina, getRutinaDetalle, updateRutina } = useRutinas();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [ejercicioActualId, setEjercicioActualId] = useState<string | null>(null);
  const ejercicioActual = useMemo(() => ejercicios.find(e => e.id === ejercicioActualId) || null, [ejercicios, ejercicioActualId]);
  const [exNombre, setExNombre] = useState("");
  const [exCategoria, setExCategoria] = useState<string | undefined>(undefined);
  const [exMusculosStr, setExMusculosStr] = useState("");
  const [exDescripcion, setExDescripcion] = useState("");
const [exImagenUrl, setExImagenUrl] = useState<string>("");
  const ejerciciosFiltrados = filteredEjercicios;
  const [tab, setTab] = useState<'ejercicios' | 'rutinas'>('ejercicios');
  const [rutinaNombre, setRutinaNombre] = useState("");
  const [rutinaNotas, setRutinaNotas] = useState("");
  const [rutinaClienteId, setRutinaClienteId] = useState<string>("");
  const [rutinaDias, setRutinaDias] = useState<string[]>([]);
  const [rutinaDetalle, setRutinaDetalle] = useState<Array<{ ejercicio_id: string; orden: number; series?: number; repeticiones?: string; tempo?: string; descanso?: string; notas?: string }>>([]);
  const [verRutinaAbierto, setVerRutinaAbierto] = useState(false);
  const [verRutinaLoading, setVerRutinaLoading] = useState(false);
  const [rutinaVista, setRutinaVista] = useState<any>(null);
  const [rutinaAsignaciones, setRutinaAsignaciones] = useState<Record<string, string>>({});
  
  const abrirNuevoEjercicio = () => {
    setEjercicioActualId(null);
    setExNombre(""); setExCategoria(undefined);
    setExMusculosStr(""); setExDescripcion(""); setExImagenUrl("");
    setDialogoAbierto(true);
  };
  const abrirEditarEjercicio = (id: string) => {
    setEjercicioActualId(id);
    const ej = ejercicios.find(e => e.id === id);
    setExNombre(ej?.nombre || "");
    setExCategoria(ej?.categoria || undefined);
    setExMusculosStr((ej?.musculos || []).join(', '));
    setExDescripcion(ej?.descripcion || "");
    setExImagenUrl(ej?.imagen_url || "");
    setDialogoAbierto(true);
  };
  const guardarEjercicio = async () => {
    if (!exNombre.trim()) { toast({ variant:'destructive', title:'Nombre requerido', description:'Ingresa el nombre del ejercicio' }); return; }
    const musculos = exMusculosStr.split(',').map(s => s.trim()).filter(Boolean);
    try {
      if (!ejercicioActual) {
        await createEjercicio({ nombre: exNombre, categoria: (exCategoria as any) || null, musculos, descripcion: exDescripcion || null, imagen_url: exImagenUrl || undefined });
      } else {
        await updateEjercicio(ejercicioActual.id, { nombre: exNombre, categoria: (exCategoria as any) || null, musculos, descripcion: exDescripcion || null, imagen_url: exImagenUrl || undefined });
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
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={exCategoria} onValueChange={(v) => setExCategoria(v)}>
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="musculos">Músculos trabajados</Label>
                <Input id="musculos" placeholder="pecho, brazos, etc." value={exMusculosStr} onChange={(e) => setExMusculosStr(e.target.value)} />
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
      
      {tab === 'ejercicios' && (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ejerciciosFiltrados.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Dumbbell className="h-10 w-10 mb-2" />
            <p>No hay ejercicios aún. Crea el primero para empezar.</p>
            <Button className="mt-3" onClick={abrirNuevoEjercicio}>Nuevo Ejercicio</Button>
          </div>
        )}
        {ejerciciosFiltrados.map((ejercicio) => (
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
                  <Input className="h-9 text-sm" placeholder="Ej. Lunes, Miércoles, Viernes" value={rutinaDias.join(', ')} onChange={(e) => setRutinaDias(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea className="text-sm" rows={3} placeholder="Indicaciones generales de la rutina" value={rutinaNotas} onChange={(e) => setRutinaNotas(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Ejercicios</Label>
                <div className="space-y-2">
                  {rutinaDetalle.map((item, idx) => {
                    const ej = ejercicios.find(e => e.id === item.ejercicio_id);
                    return (
                      <div key={idx} className="grid md:grid-cols-6 gap-2 items-end">
                        <div className="md:col-span-2">
                          <Select value={item.ejercicio_id} onValueChange={(v) => {
                            setRutinaDetalle(prev => {
                              const next = [...prev];
                              next[idx].ejercicio_id = v;
                              return next;
                            });
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ejercicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {ejercicios.map((e: EjercicioRow) => (<SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          {ej?.imagen_url && <img src={ej.imagen_url} className="mt-1 h-12 w-12 object-contain rounded bg-muted" />}
                        </div>
                        <Input className="h-9 text-sm" type="number" placeholder="Orden" value={item.orden} onChange={(e) => {
                          const val = e.target.value;
                          setRutinaDetalle(prev => {
                            const next = [...prev];
                            next[idx].orden = val === '' ? 0 : parseInt(val, 10) || 0;
                            return next;
                          });
                        }} />
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
                        <Input className="h-9 text-sm" placeholder="Descanso" value={item.descanso ?? ''} onChange={(e) => {
                          const val = e.target.value;
                          setRutinaDetalle(prev => {
                            const next = [...prev];
                            next[idx].descanso = val;
                            return next;
                          });
                        }} />
                        <Button className="h-9 text-sm" variant="outline" onClick={() => { const next=[...rutinaDetalle]; next.splice(idx,1); setRutinaDetalle(next); }}>Quitar</Button>
                      </div>
                    );
                  })}
                  <Button variant="outline" className="gap-2" onClick={() => setRutinaDetalle([...rutinaDetalle, { ejercicio_id: '', orden: rutinaDetalle.length+1 }])}>
                    <Plus className="h-4 w-4" /> Añadir ejercicio
                  </Button>
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
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={verRutinaAbierto} onOpenChange={setVerRutinaAbierto}>
            <DialogContent className="sm:max-w-[700px]">
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
                <div className="space-y-4">
                  {rutinaVista?.rutina?.notas && (
                    <div>
                      <Label>Notas</Label>
                      <p className="text-sm text-muted-foreground">{rutinaVista.rutina.notas}</p>
                    </div>
                  )}
                  <div>
                    <Label>Ejercicios</Label>
                    <div className="space-y-3 mt-2">
                      {(rutinaVista?.detalle || []).map((item: any, idx: number) => (
                        <div key={idx} className="grid md:grid-cols-6 gap-2 items-center">
                          <div className="md:col-span-2 flex items-center gap-2">
                            {item.ejercicios?.imagen_url && (
                              <img
                                src={item.ejercicios.imagen_url}
                                className="h-12 w-12 object-contain rounded bg-muted"
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
                          <div>
                            <Label className="text-xs">Tempo</Label>
                            <div>{item.tempo ?? '-'}</div>
                          </div>
                          <div>
                            <Label className="text-xs">Descanso</Label>
                            <div>{item.descanso ?? '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setVerRutinaAbierto(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
