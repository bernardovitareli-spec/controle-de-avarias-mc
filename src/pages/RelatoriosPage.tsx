import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Inbox } from "lucide-react";
import { useAvariasData } from "@/modules/avarias/useAvariasData";
import { PdfReportDialog } from "@/components/PdfReportDialog";

export default function RelatoriosPage() {
  const { loading, hasReal, rows, importacao } = useAvariasData();
  const [open, setOpen] = useState(false);
  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Relatórios"
        subtitle="Gere o relatório completo em PDF a partir dos dados importados."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Relatório de Avarias</CardTitle>
          <CardDescription>
            Gera um PDF com resumo executivo, gráficos e detalhamento dos registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : !hasReal ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">Sem dados</p>
              <p className="text-xs mt-1">Importe uma planilha para habilitar o relatório.</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Base atual: <span className="font-medium text-foreground">{rows.length}</span> registros
                {importacao && (
                  <> · arquivo <code className="text-xs">{importacao.nome_arquivo}</code></>
                )}
              </div>
              <Button onClick={() => setOpen(true)}>
                <FileDown className="h-4 w-4 mr-1.5" /> Gerar Relatório PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PdfReportDialog
        open={open}
        onOpenChange={setOpen}
        data={rows}
        filters={{ contratos: [], pareceres: [], placas: [], criticidades: [], nf: [] }}
        meta={{
          arquivoOrigem: importacao?.nome_arquivo,
          dataImportacao: importacao?.data_importacao,
        }}
        totalDashboard={total}
      />
    </div>
  );
}
