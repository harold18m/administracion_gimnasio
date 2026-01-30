
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Try Supabase Auth Login (for SaaS Users/Admins)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (!authError && authData.user) {
         // Fetch role from user_roles
         const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role, tenant_id')
            .eq('user_id', authData.user.id)
            .maybeSingle(); 

         if (roleData) {
             const role = roleData.role as any;
             
             // Check if super_admin
             if (role === 'super_admin') {
                 login(values.email, 'admin', ['super_admin']); 
                 navigate("/super-admin");
                 return;
             }
             
             // For gym owners/admins
             login(values.email, 'admin', []); 
             navigate("/");
             return;
         }
      }

      // 2. Legacy Admin Check (Fallback)
      if (values.email === "admin@fitgym.com") {
         // ... existing legacy admin logic ...
         login(values.email, 'admin', []);
         toast({ title: "Inicio de sesión exitoso", description: "Bienvenido, Administrador (Legacy)." });
         navigate("/");
         return;
      }

      // 3. Legacy Employee Check (Fallback)
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', values.email)
        .eq('password', values.password) 
        .single();

      if (error || !data) {
        throw new Error("Credenciales incorrectas");
      }

      // Employee Login
      login(data.email, 'empleado', data.permisos || []);
      toast({ title: "Inicio de sesión exitoso", description: `Bienvenido, ${data.nombre}.` });
      navigate("/");

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Credenciales incorrectas o acceso denegado.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Logo />
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                        <FormLabel>Contraseña</FormLabel>
                        <Link 
                            to="/recuperar-password" 
                            className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
