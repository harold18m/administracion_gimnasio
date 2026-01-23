import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  MessageSquare,
  Users,
  Calendar,
  Settings,
  Bot,
  Menu,
  Fingerprint,
  CreditCard,
  User,
  UserCheck,
  Wallet,
  Megaphone
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { Link, useLocation } from 'react-router-dom';

type SidebarItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const sidebarSections: { label: string; items: SidebarItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: User, label: 'Perfil', href: '/perfil' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { icon: Fingerprint, label: 'Asistencia', href: '/asistencia' },
      // { icon: UserCheck, label: 'Aforo', href: '/aforo' },
      { icon: Users, label: 'Clientes', href: '/clientes' },
      { icon: Dumbbell, label: 'Ejercicios', href: '/rutinas' },
      { icon: CreditCard, label: 'Membresías', href: '/membresias' },
      { icon: Wallet, label: 'Pagos', href: '/pagos' },
      { icon: Calendar, label: 'Calendario', href: '/calendario' },
    ],
  },
  {
    label: 'Config',
    items: [
      { icon: Settings, label: 'Configuración', href: '/configuracion' },
      { icon: Megaphone, label: 'Anuncios', href: '/anuncios' },
    ],
  },
];

import { useGymSettings } from '@/hooks/useGymSettings';

export function GymSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const { logoUrl } = useGymSettings();

  return (
    <Sidebar className="border-r" variant="sidebar" collapsible="icon" data-testid="sidebar">
      <SidebarHeader className="flex h-24 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo withText={state !== 'collapsed'} size={120} src={logoUrl} />
        </Link>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-3 md:p-4">
        {sidebarSections.map((section, idx) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs tracking-wide uppercase text-sidebar-foreground/60">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      size="lg"
                      className="rounded-lg gap-3"
                    >
                      <Link to={item.href} className="flex items-center gap-3">
                        <span className="inline-flex"><item.icon className="h-5 w-5" /></span>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            {idx < sidebarSections.length - 1 && (
              <SidebarSeparator />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}