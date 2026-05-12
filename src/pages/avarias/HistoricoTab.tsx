import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export default function HistoricoTab() {
  return (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">
        <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-foreground">Histórico de Importações</p>
        <p className="text-sm mt-1">
          Lista de lotes importados com totais, ações de cancelar e reprocessar — <strong>Etapa 7</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
