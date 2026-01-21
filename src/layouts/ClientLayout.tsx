import { Outlet, NavLink } from "react-router-dom";
import { Home, User, Dumbbell, CreditCard } from "lucide-react";

export function ClientLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main Content Area */}
      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-50 h-16 safe-area-bottom">
        <ul className="grid grid-cols-4 h-full">
          <li>
            <NavLink
              to="/app/home"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                }`
              }
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">Inicio</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/rutina"
              onClick={() => window.dispatchEvent(new Event("reset-rutina-view"))}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                }`
              }
            >
              <Dumbbell className="h-5 w-5" />
              <span className="text-[10px] font-medium">Rutina</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/pagos"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                }`
              }
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-[10px] font-medium">Pagos</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/perfil"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                }`
              }
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Perfil</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
