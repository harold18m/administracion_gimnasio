
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GymLayout } from "./components/GymLayout";
import Dashboard from "./pages/Dashboard";
import Rutinas from "./pages/Rutinas";
import Clientes from "./pages/Clientes";
import Asistencia from "./pages/Asistencia";
import Calendario from "./pages/Calendario";
import Configuracion from "./pages/Configuracion";
import Membresias from "./pages/Membresias";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Kiosko from "./pages/Kiosko";
import Pagos from "./pages/Pagos";
import Anuncios from "./pages/Anuncios";
import NotFound from "./pages/NotFound";
import { useState, useEffect, createContext, useContext } from "react";
import Perfil from "./pages/Perfil";
import { ClientLayout } from "./layouts/ClientLayout";
import ClientLogin from "./pages/client/ClientLogin";
import ClientHome from "./pages/client/ClientHome";
import ClientRutina from "./pages/client/ClientRutina";
import ClientPagos from "./pages/client/ClientPagos";
import ClientPerfil from "./pages/client/ClientPerfil";

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

import { ClientAuthProvider, useClientAuth } from "./hooks/useClientAuth";

// ... previous imports ...

// Componente de protección de rutas para Clientes
const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useClientAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
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
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/kiosko" element={<Kiosko />} />

              {/* Rutas App Clientes */}
              <Route path="/app/login" element={<ClientLogin />} />
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
                {/* Página de WhatsApp eliminada */}
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/pagos" element={<Pagos />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/anuncios" element={<Anuncios />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </ClientAuthProvider>
    </AuthContext.Provider>
  );
};

export default App;
