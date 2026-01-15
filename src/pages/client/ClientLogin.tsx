import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Cuenta creada",
          description: "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
        });
        setIsSignUp(false); // Switch back to login after signup attempt
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/app/home");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Ocurrió un error al intentar ingresar.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-sm shadow-lg border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">FitGym Cliente</CardTitle>
          <CardDescription>
            Ingresa para ver tu rutina y asistencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="cliente@ejemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignUp ? "Registrarse" : "Ingresar"}
            </Button>
            <div className="text-center text-sm pt-2">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿Eres nuevo? Regístrate aquí"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
