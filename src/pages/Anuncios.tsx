import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Image, Type, Save, Eye, PanelLeft, PanelRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AnuncioConfig {
  id?: string;
  posicion: 'izquierda' | 'derecha';
  tipo: 'texto' | 'imagen';
  contenido: string;
  titulo: string;
  activo: boolean;
  color_fondo: string;
  color_texto: string;
}

const defaultAnuncio: AnuncioConfig = {
  posicion: 'izquierda',
  tipo: 'texto',
  contenido: '',
  titulo: '',
  activo: true,
  color_fondo: '#1a1a1a',
  color_texto: '#ffffff'
};

export default function Anuncios() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [anuncioIzquierda, setAnuncioIzquierda] = useState<AnuncioConfig>({ ...defaultAnuncio, posicion: 'izquierda' });
  const [anuncioDerecha, setAnuncioDerecha] = useState<AnuncioConfig>({ ...defaultAnuncio, posicion: 'derecha' });

  // Cargar anuncios
  useEffect(() => {
    const cargarAnuncios = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('anuncios_kiosko')
          .select('*');

        if (error) {
          console.error('Error al cargar anuncios:', error);
          return;
        }

        if (data) {
          data.forEach(anuncio => {
            if (anuncio.posicion === 'izquierda') {
              setAnuncioIzquierda({
                id: anuncio.id,
                posicion: 'izquierda',
                tipo: anuncio.tipo as 'texto' | 'imagen',
                contenido: anuncio.contenido || '',
                titulo: anuncio.titulo || '',
                activo: anuncio.activo,
                color_fondo: anuncio.color_fondo || '#1a1a1a',
                color_texto: anuncio.color_texto || '#ffffff'
              });
            } else if (anuncio.posicion === 'derecha') {
              setAnuncioDerecha({
                id: anuncio.id,
                posicion: 'derecha',
                tipo: anuncio.tipo as 'texto' | 'imagen',
                contenido: anuncio.contenido || '',
                titulo: anuncio.titulo || '',
                activo: anuncio.activo,
                color_fondo: anuncio.color_fondo || '#1a1a1a',
                color_texto: anuncio.color_texto || '#ffffff'
              });
            }
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarAnuncios();
  }, []);

  const guardarAnuncio = async (anuncio: AnuncioConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anuncios_kiosko')
        .upsert({
          id: anuncio.id,
          posicion: anuncio.posicion,
          tipo: anuncio.tipo,
          contenido: anuncio.contenido,
          titulo: anuncio.titulo,
          activo: anuncio.activo,
          color_fondo: anuncio.color_fondo,
          color_texto: anuncio.color_texto
        }, { onConflict: 'posicion' });

      if (error) throw error;

      toast({
        title: "Guardado",
        description: `Anuncio ${anuncio.posicion} actualizado correctamente`
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el anuncio"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderAnuncioForm = (
    anuncio: AnuncioConfig,
    setAnuncio: React.Dispatch<React.SetStateAction<AnuncioConfig>>,
    label: string,
    Icon: React.ElementType
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{label}</CardTitle>
              <CardDescription>Personaliza el panel {anuncio.posicion}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`activo-${anuncio.posicion}`} className="text-sm">Activo</Label>
            <Switch
              id={`activo-${anuncio.posicion}`}
              checked={anuncio.activo}
              onCheckedChange={(checked) => setAnuncio({ ...anuncio, activo: checked })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Tipo de contenido</Label>
          <Select
            value={anuncio.tipo}
            onValueChange={(value: 'texto' | 'imagen') => setAnuncio({ ...anuncio, tipo: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="texto">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span>Texto</span>
                </div>
              </SelectItem>
              <SelectItem value="imagen">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Imagen (URL)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Título (opcional)</Label>
          <Input
            value={anuncio.titulo}
            onChange={(e) => setAnuncio({ ...anuncio, titulo: e.target.value })}
            placeholder="Ej: Promoción del mes"
            className="mt-1"
          />
        </div>

        <div>
          <Label>{anuncio.tipo === 'texto' ? 'Contenido' : 'URL de la imagen'}</Label>
          {anuncio.tipo === 'texto' ? (
            <Textarea
              value={anuncio.contenido}
              onChange={(e) => setAnuncio({ ...anuncio, contenido: e.target.value })}
              placeholder="Escribe el texto que deseas mostrar..."
              rows={4}
              className="mt-1"
            />
          ) : (
            <Input
              value={anuncio.contenido}
              onChange={(e) => setAnuncio({ ...anuncio, contenido: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="mt-1"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Color de fondo</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={anuncio.color_fondo}
                onChange={(e) => setAnuncio({ ...anuncio, color_fondo: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={anuncio.color_fondo}
                onChange={(e) => setAnuncio({ ...anuncio, color_fondo: e.target.value })}
                placeholder="#1a1a1a"
              />
            </div>
          </div>
          <div>
            <Label>Color del texto</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={anuncio.color_texto}
                onChange={(e) => setAnuncio({ ...anuncio, color_texto: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={anuncio.color_texto}
                onChange={(e) => setAnuncio({ ...anuncio, color_texto: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4" />
            Vista previa
          </Label>
          <div
            className="rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: anuncio.color_fondo, color: anuncio.color_texto }}
          >
            {anuncio.titulo && (
              <h3 className="font-bold text-lg mb-2">{anuncio.titulo}</h3>
            )}
            {anuncio.tipo === 'texto' ? (
              <p className="whitespace-pre-wrap">{anuncio.contenido || 'Sin contenido'}</p>
            ) : anuncio.contenido ? (
              <img
                src={anuncio.contenido}
                alt="Preview"
                className="max-h-32 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="red">Error</text></svg>';
                }}
              />
            ) : (
              <p className="opacity-50">URL de imagen vacía</p>
            )}
          </div>
        </div>

        <Button
          onClick={() => guardarAnuncio(anuncio)}
          className="w-full"
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anuncios del Kiosko</h1>
          <p className="text-muted-foreground">
            Personaliza los paneles laterales de la pantalla del kiosko
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderAnuncioForm(anuncioIzquierda, setAnuncioIzquierda, "Panel Izquierdo", PanelLeft)}
        {renderAnuncioForm(anuncioDerecha, setAnuncioDerecha, "Panel Derecho", PanelRight)}
      </div>
    </div>
  );
}
