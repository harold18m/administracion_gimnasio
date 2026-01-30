
import React from 'react';
import {
  LayoutDashboard,
  Building,
  Settings,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/super-admin' },
  { icon: Building, label: 'Gimnasios (Tenants)', href: '/super-admin/tenants' },
  { icon: ShieldCheck, label: 'Planes y Límites', href: '/super-admin/plans' },
  { icon: User, label: 'CRM / Prospectos', href: '/super-admin/crm' },
  { icon: Settings, label: 'Configuración Global', href: '/super-admin/settings' },
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();

  return (
    <Sidebar className="border-r" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex h-16 items-center px-4 border-b">
        <Link to="/super-admin" className="flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {state !== 'collapsed' && <span>Super Admin</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname !== '/super-admin' && pathname.startsWith(item.href) && item.href !== '/super-admin')}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
