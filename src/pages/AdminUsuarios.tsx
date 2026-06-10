import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole, ROLE_LABEL } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

type AdminUserRow = {
  user_id: string;
  email: string;
  created_at: string;
  roles: string[];
};

const ROLE_OPTIONS: { value: AppRole | "none"; label: string }[] = [
  { value: "admin", label: ROLE_LABEL.admin },
  { value: "gestor", label: ROLE_LABEL.gestor },
  { value: "leitor", label: ROLE_LABEL.leitor },
  { value: "apontador", label: ROLE_LABEL.apontador },
  { value: "none", label: "Sem papel" },
];

function principalRole(roles: string[]): AppRole | "none" {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("gestor")) return "gestor";
  if (roles.includes("apontador")) return "apontador";
  if (roles.includes("leitor")) return "leitor";
  return "none";
}

export default function AdminUsuarios() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    enabled: isAdmin,
    queryFn: async (): Promise<AdminUserRow[]> => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta área é exclusiva para administradores.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = async (target: string, value: AppRole | "none") => {
    try {
      if (value === "none") {
        const { error } = await supabase.rpc("clear_user_roles", { _target: target });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("set_user_role", { _target: target, _role: value });
        if (error) throw error;
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
        qc.invalidateQueries({ queryKey: ["user-roles"] }),
      ]);
      toast.success("Papel atualizado");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao atualizar papel");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Defina o papel de cada usuário do sistema."
      />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">
                Erro ao carregar usuários: {(error as Error).message}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="w-[180px]">Criado em</TableHead>
                    <TableHead className="w-[220px]">Papel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((u) => {
                    const isSelf = u.user_id === user?.id;
                    const current = principalRole(u.roles ?? []);
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.email}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={current}
                            disabled={isSelf}
                            onValueChange={(v) => handleChange(u.user_id, v as AppRole | "none")}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
