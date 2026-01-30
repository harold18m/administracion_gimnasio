import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dumbbell, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Registro() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
            data: {
                full_name: values.nombre,
            }
        }
      });

      if (authError) throw authError;

      // 2. Claim Invitation if token exists
      if (token) {
        const { error: claimError } = await supabase.rpc('claim_invitation', { token_input: token });
        if (claimError) {
             console.error("Error claiming invitation:", claimError);
             toast({
                variant: "destructive",
                title: "Advertencia",
                description: "Cuenta creada, pero hubo un error al vincular el gimnasio. Contacta soporte.",
             });
        } else {
             toast({
                title: "¡Bienvenido Owner!",
                description: "Tu gimnasio ha sido vinculado exitosamente.",
             });
        }
      } else {
        toast({
          title: "Registro exitoso",
          description: "Por favor verifica tu correo (si está configurado) o inicia sesión.",
        });
      }

      navigate("/login");
      
    } catch (error: any) {
      setIsLoading(false);
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Por favor, intenta de nuevo más tarde",
      });
    } finally {
        setIsLoading(false);
    }
  }

  // If no token, maybe we want to disable registration? Or leave it open?
  // For now, allow registration but show special message if token exists.

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-primary mr-2" />
            <h2 className="text-3xl font-bold">FitGym</h2>
          </div>
          <CardTitle className="text-2xl text-center">
            {token ? "Activar Cuenta de Gimnasio" : "Crear cuenta"}
          </CardTitle>
          <CardDescription className="text-center">
            {token 
                ? "Regístrate para tomar control de tu gimnasio." 
                : "Ingresa tus datos para registrarte en el sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {token && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-md flex items-start gap-3">
                      <ArrowRight className="h-5 w-5 text-indigo-500 mt-0.5" />
                      <div className="text-sm text-indigo-700 font-medium">
                          Estás a un paso de activar tu panel de administración.
                      </div>
                  </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrando..." : (token ? "Activar Gimnasio" : "Registrarse")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
