import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Upload,
  History,
  FileBarChart2,
  Users,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Item {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  show?: boolean;
}

interface Section {
  label: string;
  items: Item[];
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, podeImportar, principalLabel, isLoading } = useUserRole();
  const navigate = useNavigate();

  const sections: Section[] = [
    {
      label: "Início",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true, show: true },
      ],
    },
    {
      label: "Operação",
      items: [
        { title: "Avarias", url: "/avarias", icon: AlertTriangle, exact: true, show: true },
        { title: "Importar", url: "/avarias/importar", icon: Upload, show: podeImportar },
        { title: "Histórico", url: "/avarias/historico", icon: History, show: true },
      ],
    },
    {
      label: "Relatórios",
      items: [
        { title: "Relatórios", url: "/relatorios", icon: FileBarChart2, show: true },
      ],
    },
    {
      label: "Admin",
      items: [
        { title: "Gerenciar usuários", url: "/admin/usuarios", icon: Users, show: isAdmin },
      ],
    },
  ];

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className={cn("flex items-center gap-2.5 px-1.5 py-1", collapsed && "justify-center px-0")}>
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold text-sm shadow-card shrink-0">
            MC
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate">Gestão de Avarias</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5 truncate">MC Terraplenagem</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => {
          const visible = section.items.filter((i) => i.show);
          if (!visible.length) return null;
          return (
            <SidebarGroup key={section.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => {
                    const active = isActive(item.url, item.exact);
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className={cn(
                            active
                              ? "bg-sidebar-accent text-primary font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent",
                          )}
                        >
                          <NavLink to={item.url} end={item.exact} className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed ? (
          <div className="px-1.5 py-1 space-y-2">
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">Sessão</div>
              <div className="text-xs font-medium truncate" title={user?.email ?? ""}>
                {user?.email ?? "—"}
              </div>
              <Badge variant="secondary" className="mt-1 text-[10px] font-medium">
                {isLoading ? "Carregando…" : principalLabel}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sair
            </Button>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair" className="h-8 w-8 text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
