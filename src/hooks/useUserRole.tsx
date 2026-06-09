import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "gestor" | "leitor" | "apontador";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  leitor: "Leitor",
  apontador: "Apontador",
};

/**
 * Lê os papéis do usuário logado (tabela user_roles) e expõe atalhos de permissão.
 * Observação: enquanto o types.ts do Supabase não for regenerado para incluir
 * a tabela user_roles, usamos um cast em `.from` — depois pode ser removido.
 */
export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: { role: AppRole }) => r.role);
    },
  });

  const roles = data ?? [];
  const has = (r: AppRole) => roles.includes(r);

  // Papel "principal" para exibição (maior privilégio primeiro)
  const principal: AppRole | null = has("admin")
    ? "admin"
    : has("gestor")
    ? "gestor"
    : has("apontador")
    ? "apontador"
    : has("leitor")
    ? "leitor"
    : null;

  return {
    roles,
    principal,
    principalLabel: principal ? ROLE_LABEL[principal] : "Sem papel",
    isLoading: isLoading && !!user?.id,
    isAdmin: has("admin"),
    isGestor: has("gestor"),
    isLeitor: has("leitor"),
    isApontador: has("apontador"),
    podeImportar: has("admin"),
    podeEditar: has("admin") || has("gestor") || has("apontador"),
    podeExcluir: has("admin"),
  };
}
