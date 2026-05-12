import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function RelatoriosTab() {
  return (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-foreground">Relatórios Executivos</p>
        <p className="text-sm mt-1">
          Exportações em CSV (e PDF posteriormente) por contrato, placa, período ou categoria — <strong>Etapa 7</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
