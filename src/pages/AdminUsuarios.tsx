import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, ROLE_LABEL, type AppRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMenu } from "@/components/UserMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  roles: string[];
}

const ROLES: AppRole[] = ["admin", "gestor", "leitor", "apontador"];

export default function AdminUsuarios() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async (): Promise<AdminUser[]> => {
      // cast: as funções RPC ainda não estão no types.ts gerado
      const { data, error } = await (supabase as any).rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const aplicarPapel = async (target: string, value: string) => {
    try {
      if (value === "none") {
        const { error } = await (supabase as any).rpc("clear_user_roles", { _target: target });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).rpc("set_user_role", {
          _target: target,
          _role: value,
        });
        if (error) throw error;
      }
      toast({ title: "Papel atualizado" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    } catch (e: any) {
      toast({
        title: "Erro ao atualizar papel",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva de administradores.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/avarias"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Atribua papéis de acesso aos usuários do sistema
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[220px]">Papel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users ?? []).map((u) => {
                    const current = u.roles?.[0] ?? "none";
                    const isSelf = u.user_id === user?.id;
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.email}{" "}
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">(você)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={current}
                            onValueChange={(v) => aplicarPapel(u.user_id, v)}
                            disabled={isSelf}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem papel</SelectItem>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABEL[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-3">
          Para criar um novo usuário, use o painel do backend (Cloud → Usuários → Adicionar
          usuário) e depois atribua o papel aqui. Seu próprio papel não pode ser alterado
          nesta tela, por segurança.
        </p>
      </main>
    </div>
  );
}
