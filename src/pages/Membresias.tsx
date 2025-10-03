import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Plus, Edit, Trash2, Users, Calendar, DollarSign, Clock, Star } from "lucide-react";
import { useMembresias } from "@/hooks/useMembresias";
import type { Database } from "@/lib/supabase";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type Membresia = Database['public']['Tables']['membresias']['Row'];
type MembresiaInsert = Database['public']['Tables']['membresias']['Insert'];

const Membresias = () => {
  const {
    membresias,
    loading,
    crearMembresia,
    actualizarMembresia,
    eliminarMembresia,
    getMembresiasPorTipo
  } = useMembresias();

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState<Membresia | null>(null);
  const [nuevaMembresia, setNuevaMembresia] = useState<Partial<MembresiaInsert>>({
    nombre: '',
    descripcion: '',
    tipo: 'mensual',
    modalidad: 'diario',
    precio: 0,
    duracion: 1,
    caracteristicas: [],
    activa: true
  });

  // Estado para confirmación de eliminación
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [membresiaAEliminar, setMembresiaAEliminar] = useState<Membresia | null>(null);
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState('');

  const tiposMembresia = [
    { value: 'mensual', label: 'Mensual', icon: CreditCard, color: 'bg-purple-100 text-purple-800' },
    { value: 'trimestral', label: 'Trimestral', icon: Star, color: 'bg-orange-100 text-orange-800' }
  ];

  const modalidadesAcceso = [
    { value: 'diario', label: 'Diario', description: 'Acceso todos los días' },
    { value: 'interdiario', label: 'Interdiario', description: 'Acceso día por medio' },
    { value: 'libre', label: 'Libre', description: 'Acceso sin restricciones' }
  ];

  const obtenerConfiguracionTipo = (tipo: string) => {
    return tiposMembresia.find(t => t.value === tipo) || tiposMembresia[0];
  };

  const obtenerModalidad = (modalidad: string) => {
    return modalidadesAcceso.find(m => m.value === modalidad) || modalidadesAcceso[0];
  };

  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim()) {
      setNuevaMembresia(prev => ({
        ...prev,
        caracteristicas: [...(prev.caracteristicas || []), nuevaCaracteristica.trim()]
      }));
      setNuevaCaracteristica('');
    }
  };

  const eliminarCaracteristica = (index: number) => {
    setNuevaMembresia(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas?.filter((_, i) => i !== index) || []
    }));
  };

  const guardarMembresia = async () => {
    if (editando) {
      const result = await actualizarMembresia(editando.id, nuevaMembresia);
      if (result.success) {
        setDialogoAbierto(false);
        setEditando(null);
        resetForm();
      }
    } else {
      const result = await crearMembresia(nuevaMembresia as MembresiaInsert);
      if (result.success) {
        setDialogoAbierto(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNuevaMembresia({
      nombre: '',
      descripcion: '',
      tipo: 'mensual',
      modalidad: 'diario',
      precio: 0,
      duracion: 1,
      caracteristicas: [],
      activa: true
    });
  };

  const editarMembresiaHandler = (membresia: Membresia) => {
    setEditando(membresia);
    setNuevaMembresia({
      nombre: membresia.nombre,
      descripcion: membresia.descripcion,
      tipo: membresia.tipo,
      modalidad: membresia.modalidad,
      precio: membresia.precio,
      duracion: membresia.duracion,
      caracteristicas: membresia.caracteristicas,
      activa: membresia.activa
    });
    setDialogoAbierto(true);
  };

  const eliminarMembresiaHandler = async (id: string) => {
    await eliminarMembresia(id);
  };

  const handleConfirmDelete = async () => {
    if (membresiaAEliminar) {
      await eliminarMembresiaHandler(membresiaAEliminar.id);
      setMembresiaAEliminar(null);
    }
  };

  const toggleEstadoMembresia = async (id: string) => {
    const membresia = membresias.find(m => m.id === id);
    if (membresia) {
      await actualizarMembresia(id, { activa: !membresia.activa });
    }
  };

  const obtenerUnidadDuracion = (tipo: string) => {
    switch (tipo) {
      case 'mensual':
        return 'mes(es)';
      case 'trimestral':
        return 'trimestre(s)';
      default:
        return 'período(s)';
    }
  };

  const membresiasPorTipo = getMembresiasPorTipo();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Membresías</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestiona los tipos de membresía y planes de tu gimnasio
            </p>
          </div>
        </div>
        
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nueva Membresía
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                {editando ? 'Editar Membresía' : 'Crear Nueva Membresía'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Configura los detalles de la membresía
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-sm">Nombre de la Membresía</Label>
                <Input
                  id="nombre"
                  value={nuevaMembresia.nombre}
                  onChange={(e) => setNuevaMembresia({...nuevaMembresia, nombre: e.target.value})}
                  placeholder="Ej: Membresía Premium"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="tipo" className="text-sm">Tipo de Membresía</Label>
                  <Select 
                    value={nuevaMembresia.tipo} 
                    onValueChange={(value) => setNuevaMembresia({...nuevaMembresia, tipo: value as 'mensual' | 'trimestral'})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposMembresia.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="modalidad" className="text-sm">Modalidad de Acceso</Label>
                  <Select 
                    value={nuevaMembresia.modalidad} 
                    onValueChange={(value) => setNuevaMembresia({...nuevaMembresia, modalidad: value as 'diario' | 'interdiario' | 'libre'})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalidadesAcceso.map(modalidad => (
                        <SelectItem key={modalidad.value} value={modalidad.value}>
                          <div>
                            <div className="font-medium text-sm">{modalidad.label}</div>
                            <div className="text-xs text-muted-foreground">{modalidad.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-sm">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={nuevaMembresia.descripcion}
                  onChange={(e) => setNuevaMembresia({...nuevaMembresia, descripcion: e.target.value})}
                  placeholder="Describe los beneficios de esta membresía"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="precio" className="text-sm">Precio (S/)</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={nuevaMembresia.precio}
                    onChange={(e) => setNuevaMembresia({...nuevaMembresia, precio: Number(e.target.value)})}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion" className="text-sm">
                    Duración ({obtenerUnidadDuracion(nuevaMembresia.tipo || 'mensual')})
                  </Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={nuevaMembresia.duracion}
                    onChange={(e) => setNuevaMembresia({...nuevaMembresia, duracion: Number(e.target.value)})}
                    placeholder="1"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Características y Beneficios</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Input
                    value={nuevaCaracteristica}
                    onChange={(e) => setNuevaCaracteristica(e.target.value)}
                    placeholder="Agregar característica"
                    onKeyPress={(e) => e.key === 'Enter' && agregarCaracteristica()}
                    className="text-sm flex-1"
                  />
                  <Button type="button" onClick={agregarCaracteristica} className="text-sm w-full sm:w-auto">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                  {nuevaMembresia.caracteristicas?.map((caracteristica, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                      {caracteristica}
                      <button
                        onClick={() => eliminarCaracteristica(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 md:mt-6">
              <Button variant="outline" onClick={() => setDialogoAbierto(false)} className="w-full sm:w-auto text-sm">
                Cancelar
              </Button>
              <Button onClick={guardarMembresia} className="w-full sm:w-auto text-sm">
                {editando ? 'Actualizar' : 'Crear'} Membresía
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          isOpen={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          onConfirm={handleConfirmDelete}
          title="Confirmar eliminación"
          description={`¿Estás seguro de eliminar la membresía "${membresiaAEliminar?.nombre || ''}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
          <TabsTrigger value="todas" className="text-xs sm:text-sm">Todas ({membresias.length})</TabsTrigger>
          {tiposMembresia.map(tipo => (
            <TabsTrigger key={tipo.value} value={tipo.value} className="text-xs sm:text-sm">
              {tipo.label} ({membresiasPorTipo.find(t => t.value === tipo.value)?.total || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {membresias.map((membresia) => {
              const config = obtenerConfiguracionTipo(membresia.tipo);
              const IconoTipo = config.icon;
              
              return (
                <Card key={membresia.id} className={`relative ${!membresia.activa ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="rounded-full bg-muted p-2 flex-shrink-0">
                          <IconoTipo className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base md:text-lg truncate">{membresia.nombre}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge className={`${config.color} text-xs`}>
                              {config.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {obtenerModalidad(membresia.modalidad).label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => editarMembresiaHandler(membresia)}>
                          <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => { setMembresiaAEliminar(membresia); setConfirmDeleteOpen(true); }}
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 pt-0">
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {membresia.descripcion}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xl md:text-2xl font-bold">S/ {membresia.precio}</span>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {membresia.duracion} {obtenerUnidadDuracion(membresia.tipo)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        {membresia.clientes_activos} activos
                      </div>
                      <Badge variant={membresia.activa ? "default" : "secondary"} className="text-xs">
                        {membresia.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm font-medium">Características:</Label>
                      <div className="flex flex-wrap gap-1">
                        {membresia.caracteristicas.map((caracteristica, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {caracteristica}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant={membresia.activa ? "outline" : "default"}
                      className="w-full text-xs md:text-sm"
                      onClick={() => toggleEstadoMembresia(membresia.id)}
                    >
                      {membresia.activa ? "Desactivar" : "Activar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {tiposMembresia.map(tipo => (
          <TabsContent key={tipo.value} value={tipo.value} className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {membresias
                .filter(m => m.tipo === tipo.value)
                .map((membresia) => {
                  const IconoTipo = tipo.icon;
                  
                  return (
                    <Card key={membresia.id} className={`relative ${!membresia.activa ? 'opacity-60' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-muted p-2">
                              <IconoTipo className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{membresia.nombre}</CardTitle>
                              <Badge className={tipo.color}>
                                {tipo.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editarMembresiaHandler(membresia)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={() => { setMembresiaAEliminar(membresia); setConfirmDeleteOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {membresia.descripcion}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-2xl font-bold">S/ {membresia.precio}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {membresia.duracion} {obtenerUnidadDuracion(membresia.tipo)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {membresia.clientesActivos} activos
                          </div>
                          <Badge variant={membresia.activa ? "default" : "secondary"}>
                            {membresia.activa ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Características:</Label>
                          <div className="flex flex-wrap gap-1">
                            {membresia.caracteristicas.map((caracteristica, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {caracteristica}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button 
                          variant={membresia.activa ? "outline" : "default"}
                          className="w-full"
                          onClick={() => toggleEstadoMembresia(membresia.id)}
                        >
                          {membresia.activa ? "Desactivar" : "Activar"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Membresias;