import { Link, NavLink, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { LayoutDashboard, AlertTriangle, Users } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** Conteúdo opcional encostado à direita, antes do UserMenu (botões de ação contextuais). */
  actions?: ReactNode;
}

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Módulo de Avarias", to: "/avarias", icon: AlertTriangle },
  { label: "Gerenciar Usuários", to: "/admin/usuarios", icon: Users, adminOnly: true },
];

export function AppHeader({ actions }: AppHeaderProps) {
  const { isAdmin } = useUserRole();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <header className="border-b bg-card/85 backdrop-blur-md sticky top-0 z-30 shadow-card">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-sm shadow-card group-hover:shadow-elevated transition-shadow">
              MC
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[15px] font-semibold tracking-tight">MC — Gestão de Avarias</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">MC Terraplenagem</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {items.map((item) => {
              const active =
                pathname === item.to ||
                (item.to !== "/" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Actions + user */}
          <div className="flex items-center gap-2">
            {actions}
            <UserMenu />
          </div>
        </div>

        {/* Nav mobile */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mt-1">
          {items.map((item) => {
            const active =
              pathname === item.to ||
              (item.to !== "/" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
