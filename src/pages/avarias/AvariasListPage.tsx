import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AvariasTable } from "@/components/AvariasTable";
import { EditAvariaDialog, EditAvariaTarget } from "@/components/EditAvariaDialog";
import { useAvariasData } from "@/modules/avarias/useAvariasData";
import { useUserRole } from "@/hooks/useUserRole";
import { Inbox, RefreshCw } from "lucide-react";

export default function AvariasListPage() {
  const { loading, hasReal, rows, refresh } = useAvariasData();
  const { podeEditar } = useUserRole();
  const [editTarget, setEditTarget] = useState<EditAvariaTarget | null>(null);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Avarias"
        subtitle="Listagem completa de avarias da última importação."
        actions={
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
        }
      />

      {loading ? (
        <Card className="shadow-card">
          <CardContent className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !hasReal ? (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">Sem dados</p>
            <p className="text-xs mt-1">Nenhuma importação real encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <AvariasTable
          data={rows}
          onEdit={
            podeEditar
              ? (item) =>
                  setEditTarget({
                    id: String(item.id),
                    placa: item.placa,
                    nf: item.nf ?? "",
                    parecer: item.parecer ?? "",
                    observacoes: item.observacoes ?? "",
                  })
              : undefined
          }
        />
      )}

      <EditAvariaDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
      />
    </div>
  );
}
