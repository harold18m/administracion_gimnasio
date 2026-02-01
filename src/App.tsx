
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
const Empleados = lazy(() => import("./pages/Empleados"));
const Productos = lazy(() => import("./pages/Productos"));
const PuntoDeVenta = lazy(() => import("./pages/PuntoDeVenta"));
const Ventas = lazy(() => import("./pages/Ventas"));

// Lazy load Super Admin Pages
const SuperAdminLayout = lazy(() => import("./pages/super-admin/Layout").then(module => ({ default: module.SuperAdminLayout })));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/Dashboard"));
const Tenants = lazy(() => import("./pages/super-admin/Tenants"));
const Plans = lazy(() => import("./pages/super-admin/Plans"));
const CrmLeads = lazy(() => import("./pages/super-admin/crm/Leads"));

// Lazy load Auth Pages
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const RecuperarPassword = lazy(() => import("./pages/RecuperarPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
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
  userEmail: string | null;
  userRole: 'admin' | 'empleado' | null;
  permissions: string[];
  login: (email: string, role?: 'admin' | 'empleado', permissions?: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userEmail: null,
  userRole: null,
  permissions: [],
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

const ProtectedRoute = ({ children, requiredPermission }: { children: React.ReactNode, requiredPermission?: string }) => {
  const { isAuthenticated, userRole, permissions } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  // Check permissions for employees
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    // Redirect to dashboard or show unauthorized
    // If trying to access dashboard but doesn't have permission, maybe show a generic "No access" page?
    // For now, redirect to first allowed page or login if none
    return <Navigate to="/" replace />; 
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

import { useGymSettings } from "./hooks/useGymSettings";
import { TenantProvider } from "./context/TenantContext";

const App = () => {
  useGymSettings(); // Initialize global settings (theme, logo)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'empleado' | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const login = (email: string, role: 'admin' | 'empleado' = 'admin', perms: string[] = []) => {
    localStorage.setItem("fitgym-auth", "true");
    localStorage.setItem("fitgym-user-email", email);
    localStorage.setItem("fitgym-user-role", role);
    localStorage.setItem("fitgym-user-permissions", JSON.stringify(perms));
    
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    setPermissions(perms);
  };

  const logout = () => {
    localStorage.removeItem("fitgym-auth");
    localStorage.removeItem("fitgym-user-email");
    localStorage.removeItem("fitgym-user-role");
    localStorage.removeItem("fitgym-user-permissions");
    // Legacy cleanup
    localStorage.removeItem("fitgym-admin-email");
    
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    setPermissions([]);
  };

  // Verificar token en el almacenamiento local al cargar
  useEffect(() => {
    const token = localStorage.getItem("fitgym-auth");
    // Check for new keys first, fallback to legacy
    const email = localStorage.getItem("fitgym-user-email") || localStorage.getItem("fitgym-admin-email");
    const role = localStorage.getItem("fitgym-user-role") as 'admin' | 'empleado' | null;
    const permsStr = localStorage.getItem("fitgym-user-permissions");
    
    if (token === "true" && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      
      // If legacy admin login (no role stored), assume admin
      if (!role && email === "admin@fitgym.com") {
          setUserRole('admin');
          setPermissions([]);
      } else {
          setUserRole(role || 'empleado');
          try {
              setPermissions(permsStr ? JSON.parse(permsStr) : []);
          } catch {
              setPermissions([]);
          }
      }
    } else {
       if (token) logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userRole, permissions, login, logout }}>
      <ClientAuthProvider>
      <TenantProvider>
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
                <Route path="/recuperar-password" element={<RecuperarPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
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

                  {/* Super Admin Routes - Isolated from GymLayout */}
                  <Route path="/super-admin" element={
                     <ProtectedRoute>
                        {/* We should check for specific super_admin role, but for now we assume admin or check permissions later */}
                        <Suspense fallback={<LoadingFallback />}>
                           { import.meta.env.VITE_SUPER_ADMIN_MODE === 'true' || userRole === 'admin' ? (
                               <SuperAdminLayout />
                           ) : <Navigate to="/" /> }
                        </Suspense>
                     </ProtectedRoute>
                  }>
                      <Route index element={<SuperAdminDashboard />} />
                      <Route path="tenants" element={<Tenants />} />
                      <Route path="plans" element={<Plans />} />
                      <Route path="crm" element={<CrmLeads />} />
                  </Route>

                  {/* Rutas Protegidas Administrativas (Gym Owner) */}
                  <Route element={
                    <ProtectedRoute>
                      <GymLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
                    <Route path="/asistencia" element={<ProtectedRoute requiredPermission="asistencia"><Asistencia /></ProtectedRoute>} />
                    <Route path="/clientes" element={<ProtectedRoute requiredPermission="clientes"><Clientes /></ProtectedRoute>} />
                    <Route path="/membresias" element={<ProtectedRoute requiredPermission="membresias"><Membresias /></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute requiredPermission="perfil"><Perfil /></ProtectedRoute>} />
                    <Route path="/ejercicios" element={<ProtectedRoute requiredPermission="rutinas"><Rutinas /></ProtectedRoute>} />
                    <Route path="/rutinas" element={<ProtectedRoute requiredPermission="rutinas"><Rutinas /></ProtectedRoute>} />
                    <Route path="/calendario" element={<ProtectedRoute requiredPermission="calendario"><Calendario /></ProtectedRoute>} />
                    <Route path="/pagos" element={<ProtectedRoute requiredPermission="pagos"><Pagos /></ProtectedRoute>} />
                    <Route path="/configuracion" element={<ProtectedRoute requiredPermission="configuracion"><Configuracion /></ProtectedRoute>} />
                    <Route path="/anuncios" element={<ProtectedRoute requiredPermission="anuncios"><Anuncios /></ProtectedRoute>} />
                    <Route path="/productos" element={<ProtectedRoute requiredPermission="productos"><Productos /></ProtectedRoute>} />
                    <Route path="/pos" element={<ProtectedRoute requiredPermission="pos"><PuntoDeVenta /></ProtectedRoute>} />
                    <Route path="/ventas" element={<ProtectedRoute requiredPermission="ventas"><Ventas /></ProtectedRoute>} />
                    
                    <Route path="/empleados" element={
                        <ProtectedRoute>
                            {userRole === 'admin' ? <Empleados /> : <Navigate to="/" />}
                        </ProtectedRoute>
                    } />
                  </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </TenantProvider>
      </ClientAuthProvider>
    </AuthContext.Provider>
  );
};

export default App;
