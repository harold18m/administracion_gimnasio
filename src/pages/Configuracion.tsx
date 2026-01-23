import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Upload, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGymSettings } from "@/hooks/useGymSettings";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Configuracion = () => {
  const { logoUrl, updateLogo, sidebarColor, updateSidebarColor } = useGymSettings();
  const { toast } = useToast();
  const [localColor, setLocalColor] = useState(sidebarColor);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setLocalColor(color);
    updateSidebarColor(color);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // Limit to 500KB for LocalStorage
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: "Por favor sube una imagen menor a 500KB para almacenarla localmente.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateLogo(base64String);
        toast({
          title: "Logo actualizado",
          description: "El nuevo logo se ha guardado correctamente.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Personaliza la apariencia de tu gimnasio
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalización de Tema
            </CardTitle>
            <CardDescription>
              Ajusta los colores de la barra lateral para que coincidan con tu marca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sidebar-color">Color de Barra Lateral</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                    <Input
                        id="sidebar-color"
                        type="color"
                        className="h-12 w-24 p-1 cursor-pointer"
                        value={localColor}
                        onChange={handleColorChange}
                    />
                </div>
                <div className="flex-1">
                    <div 
                        className="h-12 w-full rounded-md border shadow-sm flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: localColor, color: getContrastColor(localColor) }}
                    >
                        Vista Previa
                    </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecciona un color de fondo. El texto se ajustará automáticamente a blanco o negro según el contraste.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo del Gimnasio
            </CardTitle>
            <CardDescription>
              Sube tu logo para mostrarlo en la barra lateral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo actual" className="max-h-32 object-contain" />
                ) : (
                    <div className="h-32 w-full flex items-center justify-center text-muted-foreground">
                        Sin logo personalizado
                    </div>
                )}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="logo-upload">Subir nueva imagen</Label>
                <div className="flex gap-2">
                    <Input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="cursor-pointer"
                    />
                    <Button variant="outline" size="icon" disabled>
                        <Upload className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Formatos recomendados: PNG, SVG. Máx 500KB.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper simple para contraste de texto en la vista previa del input color
function getContrastColor(hexColor: string) {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export default Configuracion;