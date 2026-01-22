
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy, useState, useEffect, createContext, useContext } from "react";
import { Loader2 } from "lucide-react";

// Lazy load Admin Pages
const GymLayout = lazy(() => import("./components/GymLayout").then(module => ({ default: module.GymLayout })));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rutinas = lazy(() => import("./pages/Rutinas"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Membresias = lazy(() => import("./pages/Membresias"));
const Pagos = lazy(() => import("./pages/Pagos"));
const Anuncios = lazy(() => import("./pages/Anuncios"));
const Perfil = lazy(() => import("./pages/Perfil"));

// Lazy load Auth Pages
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const Kiosko = lazy(() => import("./pages/Kiosko"));

// Lazy load Client Pages
const ClientLayout = lazy(() => import("./layouts/ClientLayout").then(module => ({ default: module.ClientLayout })));
const ClientLogin = lazy(() => import("./pages/client/ClientLogin"));
const ClientHome = lazy(() => import("./pages/client/ClientHome"));
const ClientRutina = lazy(() => import("./pages/client/ClientRutina"));
const ClientPagos = lazy(() => import("./pages/client/ClientPagos"));
const ClientPerfil = lazy(() => import("./pages/client/ClientPerfil"));
const ClientUpdatePassword = lazy(() => import("./pages/client/ClientUpdatePassword"));

import NotFound from "./pages/NotFound";
import { ClientAuthProvider, useClientAuth } from "./hooks/useClientAuth";

// Crear contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

// Componente de protección de rutas para Clientes
const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useClientAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }

  if (!session) {
    return <Navigate to="/app/login" replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  // Para simplificar, asumimos autenticado durante desarrollo
  // En una implementación real, esto verificaría el estado de autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    true // Cambiado a true para desarrollo - permite acceso directo a la configuración
  );

  const login = () => {
    localStorage.setItem("fitgym-auth", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("fitgym-auth");
    setIsAuthenticated(false);
  };

  // Verificar token en el almacenamiento local al cargar
  useEffect(() => {
    const token = localStorage.getItem("fitgym-auth");
    setIsAuthenticated(token === "true");
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <ClientAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/kiosko" element={<Kiosko />} />

                {/* Rutas App Clientes */}
                <Route path="/app/login" element={<ClientLogin />} />
                <Route path="/app/update-password" element={<ClientUpdatePassword />} />
                <Route path="/app" element={
                  // Wrap Client Routes with Protected Logic
                   <ClientProtectedRoute>
                     <ClientLayout />
                   </ClientProtectedRoute>
                }>
                  <Route index element={<Navigate to="/app/home" replace />} />
                  <Route path="home" element={<ClientHome />} />
                  <Route path="rutina" element={<ClientRutina />} />
                  <Route path="pagos" element={<ClientPagos />} />
                  <Route path="perfil" element={<ClientPerfil />} />
                </Route>

                {/* Rutas Protegidas Administrativas */}
                <Route element={
                  <ProtectedRoute>
                    <GymLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/asistencia" element={<Asistencia />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/membresias" element={<Membresias />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/ejercicios" element={<Rutinas />} />
                  {/* Solo ruta de Rutinas */}
                  <Route path="/rutinas" element={<Rutinas />} />
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="/anuncios" element={<Anuncios />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </ClientAuthProvider>
    </AuthContext.Provider>
  );
};

export default App;
