import { useClientAuth } from "@/hooks/useClientAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Phone, User, ShieldAlert, Camera, Upload, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PRESET_AVATARS = [
  "/images/erizo_rutina.webp",
  "/images/erizo_inicio.webp",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Leo",
  "https://api.dicebear.com/9.x/bottts/svg?seed=GymBot",
];

export default function ClientPerfil() {
  const { cliente, user, signOut } = useClientAuth();
  const navigate = useNavigate();
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/app/login");
  };

  const handleUpdateAvatar = async (url: string) => {
    if (!cliente) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ avatar_url: url })
        .eq('id', cliente.id);

      if (error) throw error;
      toast.success("Avatar actualizado correctamente");
      setIsUpdateOpen(false);
      window.location.reload(); // Simple reload to reflect changes globally
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar avatar");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cliente) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
       toast.error("La imagen no debe superar los 2MB");
       return;
    }

    setUpdating(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${cliente.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
         if (uploadError.message.includes("Bucket not found")) {
            throw new Error("El sistema de archivos no está configurado. Contacta al admin.");
         }
         throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await handleUpdateAvatar(publicUrl);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al subir imagen");
      setUpdating(false);
    }
  };

  if (!cliente) return null;

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogTrigger asChild>
            <div className="relative inline-block cursor-pointer group">
                <Avatar className="h-24 w-24 mx-auto border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                <AvatarImage src={cliente.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {cliente.nombre.substring(0, 2).toUpperCase()}
                </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md">
                    <Camera className="h-4 w-4" />
                </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar Foto de Perfil</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                {/* Section 1: Presets */}
                <div>
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">Elegir un avatar</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {PRESET_AVATARS.map((avatar, i) => (
                            <button
                                key={i}
                                onClick={() => handleUpdateAvatar(avatar)}
                                disabled={updating}
                                className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary ${cliente.avatar_url === avatar ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/30'}`}
                            >
                                <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                                {cliente.avatar_url === avatar && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-primary-foreground drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">O sube tu foto</span>
                    </div>
                </div>

                {/* Section 2: Upload */}
                <div className="flex justify-center">
                    <Button variant="outline" className="w-full relative" disabled={updating}>
                        {updating ? (
                            "Actualizando..."
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Subir desde galería
                            </>
                        )}
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={updating}
                        />
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        <h1 className="text-xl font-bold">{cliente.nombre}</h1>
        <p className="text-sm text-muted-foreground">{cliente.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-muted-foreground text-xs">DNI</p>
              <p>{cliente.dni || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-muted-foreground text-xs">Teléfono</p>
              <p>{cliente.telefono}</p>
            </div>
          </div>
          {cliente.condicion_medica && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-md text-red-700 dark:text-red-400">
              <ShieldAlert className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Condición Médica</p>
                <p>{cliente.condicion_medica}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
      
      <p className="text-center text-xs text-muted-foreground pt-4">
        FitGym Mobile v1.0
      </p>
    </div>
  );
}
