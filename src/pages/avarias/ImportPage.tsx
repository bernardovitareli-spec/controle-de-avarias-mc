import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import ImportTab from "./ImportTab";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ImportPage() {
  const navigate = useNavigate();
  const { podeImportar, isLoading } = useUserRole();

  if (isLoading) return null;

  if (!podeImportar) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle>Acesso restrito</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A importação de planilhas é restrita a administradores.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Importar Planilha"
        subtitle="Carregue uma planilha de avarias para conferência e gravação."
      />
      <ImportTab onImported={() => navigate("/avarias/historico")} />
    </div>
  );
}
