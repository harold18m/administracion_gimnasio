
import { SidebarProvider, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from "@/App";

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Assuming existing auth hook works for logout

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <SidebarProvider style={{ ['--sidebar-width']: '18rem' } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <SuperAdminSidebar />
        <SidebarRail />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b flex items-center px-6 justify-between bg-card text-card-foreground">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">Panel de Control</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-muted/20">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
