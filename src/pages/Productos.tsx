import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Tag } from "lucide-react";
import { useProductos } from "@/hooks/useProductos";
import type { Producto } from "@/types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function Productos() {
  const {
    productos,
    categorias,
    loading,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearCategoria,
    eliminarCategoria
  } = useProductos();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [categoriaDialogoAbierto, setCategoriaDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  
  // Estado para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    nombre: "",
    descripcion: "",
    precio: 0,
    costo: 0,
    stock_actual: 0,
    min_stock: 5,
    codigo_barras: "",
    activo: true,
    categoria_id: null
  });

  // Estado para nueva categoría
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");

  // Eliminación
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  // Filtrado
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_barras?.includes(searchTerm) ||
    p.categoria?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNuevoProducto = () => {
    setEditando(null);
    setNuevoProducto({
      nombre: "",
      descripcion: "",
      precio: 0,
      costo: 0,
      stock_actual: 0,
      min_stock: 5,
      codigo_barras: "",
      activo: true,
      categoria_id: null
    });
    setDialogoAbierto(true);
  };

  const handleEditarProducto = (producto: Producto) => {
    setEditando(producto);
    setNuevoProducto({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio,
      costo: producto.costo || 0,
      stock_actual: producto.stock_actual,
      min_stock: producto.min_stock || 5,
      codigo_barras: producto.codigo_barras || "",
      activo: producto.activo,
      categoria_id: producto.categoria_id
    });
    setDialogoAbierto(true);
  };

  const guardarProducto = async () => {
    if (!nuevoProducto.nombre || nuevoProducto.precio === undefined) return;

    let result;
    if (editando) {
      result = await actualizarProducto(editando.id, nuevoProducto);
    } else {
      result = await crearProducto(nuevoProducto);
    }

    if (result.success) {
      setDialogoAbierto(false);
    }
  };

  const handleEliminarProducto = async () => {
    if (productoAEliminar) {
      await eliminarProducto(productoAEliminar.id);
      setProductoAEliminar(null);
    }
  };

  const handleCrearCategoria = async () => {
      if (nuevaCategoriaNombre.trim()) {
          const res = await crearCategoria(nuevaCategoriaNombre);
          if (res.success) {
              setNuevaCategoriaNombre("");
              setCategoriaDialogoAbierto(false);
          }
      }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
            <p className="text-muted-foreground">Gestiona tus productos y control de stock</p>
          </div>
        </div>
        <div className="flex gap-2">
            <Dialog open={categoriaDialogoAbierto} onOpenChange={setCategoriaDialogoAbierto}>
                <DialogTrigger asChild>
                    <Button variant="outline"> <Tag className="mr-2 h-4 w-4"/> Categorías</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Gestionar Categorías</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Nueva categoría..." 
                                value={nuevaCategoriaNombre}
                                onChange={e => setNuevaCategoriaNombre(e.target.value)}
                            />
                            <Button onClick={handleCrearCategoria}>Crear</Button>
                        </div>
                        <div className="space-y-2">
                            {categorias.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-2 border rounded-md">
                                    <span>{c.nombre}</span>
                                    <Button variant="ghost" size="sm" onClick={() => eliminarCategoria(c.id)} className="text-red-500">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Button onClick={handleNuevoProducto}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Buscar por nombre, código o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Resumen Cards (Optional, can be added later) */}
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Productos ({productosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                    ) : productosFiltrados.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron productos</TableCell></TableRow>
                    ) : (
                        productosFiltrados.map((prod) => (
                            <TableRow key={prod.id}>
                                <TableCell>
                                    <div className="font-medium">{prod.nombre}</div>
                                    {prod.codigo_barras && <div className="text-xs text-muted-foreground">{prod.codigo_barras}</div>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{prod.categoria?.nombre || "Sin cat."}</Badge>
                                </TableCell>
                                <TableCell>S/ {prod.precio.toFixed(2)}</TableCell>
                                <TableCell>
                                    <div className={`flex items-center gap-2 ${prod.stock_actual <= (prod.min_stock || 5) ? "text-red-500 font-bold" : ""}`}>
                                        {prod.stock_actual}
                                        {prod.stock_actual <= (prod.min_stock || 5) && <AlertTriangle className="h-3 w-3" />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={prod.activo ? "default" : "secondary"}>
                                        {prod.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditarProducto(prod)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setProductoAEliminar(prod); setConfirmDeleteOpen(true); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
      </Card>

      {/* Dialogo Crear/Editar */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{editando ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nombre del Producto</Label>
                        <Input 
                            value={nuevoProducto.nombre} 
                            onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} 
                            placeholder="Ej: Proteína Whey"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select 
                            value={nuevoProducto.categoria_id || "none"} 
                            onValueChange={v => setNuevoProducto({...nuevoProducto, categoria_id: v === "none" ? null : v})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin Categoría</SelectItem>
                                {categorias.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea 
                         value={nuevoProducto.descripcion || ""} 
                         onChange={e => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Precio Venta (S/)</Label>
                        <Input type="number"
                            value={nuevoProducto.precio} 
                            onChange={e => setNuevoProducto({...nuevoProducto, precio: parseFloat(e.target.value)})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Costo (S/) (Opcional)</Label>
                        <Input type="number"
                            value={nuevoProducto.costo} 
                            onChange={e => setNuevoProducto({...nuevoProducto, costo: parseFloat(e.target.value)})} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Stock Actual</Label>
                        <Input type="number"
                            value={nuevoProducto.stock_actual} 
                            onChange={e => setNuevoProducto({...nuevoProducto, stock_actual: parseInt(e.target.value)})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Stock Mínimo</Label>
                        <Input type="number"
                            value={nuevoProducto.min_stock} 
                            onChange={e => setNuevoProducto({...nuevoProducto, min_stock: parseInt(e.target.value)})} 
                        />
                    </div>
                </div>
                 
                 <div className="space-y-2">
                    <Label>Código de Barras</Label>
                    <Input 
                        value={nuevoProducto.codigo_barras || ""} 
                        onChange={e => setNuevoProducto({...nuevoProducto, codigo_barras: e.target.value})} 
                        placeholder="Escanea o ingresa manualmente"
                    />
                 </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogoAbierto(false)}>Cancelar</Button>
                <Button onClick={guardarProducto}>Guardar</Button>
            </div>
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleEliminarProducto}
        title="Eliminar Producto"
        description="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
