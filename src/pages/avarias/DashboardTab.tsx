import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DashboardTab() {
  return (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-foreground">Dashboard do módulo</p>
        <p className="text-sm mt-1">
          O dashboard executivo será conectado aos dados importados na <strong>Etapa 4</strong> do plano,
          preservando o layout atual em <code className="px-1 py-0.5 rounded bg-muted text-xs">/</code>.
        </p>
      </CardContent>
    </Card>
  );
}
