import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { principalLabel, isLoading, isAdmin } = useUserRole();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="max-w-[180px] truncate">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs text-muted-foreground">Sessão</div>
          <div className="text-sm truncate">{user.email}</div>
          <div className="mt-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {isLoading ? "Carregando papel…" : principalLabel}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/admin/usuarios")}>
            <Users className="h-4 w-4 mr-2" /> Gerenciar usuários
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
