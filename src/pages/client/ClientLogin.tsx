import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Loader2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reset Password State
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/app/home");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "¡Cuenta creada!",
        description: "Revisa tu correo para confirmar tu cuenta.",
      });
      setActiveTab("login");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "No se pudo crear la cuenta.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto bg-gradient-to-br from-primary to-primary/70 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            FITGYM
          </CardTitle>
          <CardDescription className="text-base">
            Tu portal de entrenamiento personal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="h-4 w-4" />
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="tu@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Ingresar
                </Button>
                
                <div className="text-center pt-2">
                    <button 
                        type="button" 
                        onClick={() => setResetOpen(true)}
                        className="text-sm text-primary hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Correo electrónico</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="tu@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Repite tu contraseña"
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Crear Cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      {/* Forgot Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={async (e) => {
                e.preventDefault();
                setResetLoading(true);
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                        redirectTo: `${window.location.origin}/app/update-password`,
                    });
                    if (error) throw error;
                    toast({
                        title: "Correo enviado",
                        description: "Si el correo existe, recibirás un enlace de recuperación.",
                    });
                    setResetOpen(false);
                    setResetEmail("");
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message || "No se pudo enviar el correo.",
                    });
                } finally {
                    setResetLoading(false);
                }
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reset-email">Correo electrónico</Label>
              <Input 
                id="reset-email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar enlace de recuperación"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
