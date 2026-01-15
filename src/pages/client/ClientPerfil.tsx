import { useClientAuth } from "@/hooks/useClientAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Phone, Mail, User, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientPerfil() {
  const { cliente, user, signOut } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/app/login");
  };

  if (!cliente) return null;

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <Avatar className="h-24 w-24 mx-auto border-4 border-background shadow-lg">
          <AvatarImage src={cliente.avatar_url || ""} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {cliente.nombre.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
