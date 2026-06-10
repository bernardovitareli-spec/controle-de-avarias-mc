import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { Avaria } from "@/data/avarias";
import {
  buildFileName,
  generatePdfReport,
  type PdfFilters,
  type PdfMeta,
  type PdfOptions,
} from "@/modules/avarias/pdfReport";
import mcLogo from "@/assets/mc-logo.png.asset.json";
import {
  renderBarChart,
  renderPieChart,
  loadImageDataUrl,
  type ChartDatum,
} from "@/modules/avarias/chartImages";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: Avaria[];
  filters: PdfFilters;
  meta: PdfMeta;
  totalDashboard: number;
  chartContract?: ChartDatum[];
  chartParecer?: ChartDatum[];
}

const defaultOptions: PdfOptions = {
  resumoExecutivo: true,
  graficos: true,
  tabelaDetalhada: true,
  analiseContrato: true,
  analiseCategoria: true,
  rankingPlacas: true,
  semNF: true,
  semParecer: true,
  observacoes: "",
};

export function PdfReportDialog({
  open,
  onOpenChange,
  data,
  filters,
  meta,
  totalDashboard,
  chartContract,
  chartParecer,
}: Props) {
  const [opts, setOpts] = useState<PdfOptions>(defaultOptions);
  const [generating, setGenerating] = useState(false);

  const set = <K extends keyof PdfOptions>(k: K, v: PdfOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const handleGenerate = async () => {
    if (!data.length) {
      toast({
        title: "Sem dados",
        description: "Não há dados disponíveis para gerar relatório com os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }
    if (data.length !== totalDashboard) {
      toast({
        title: "Divergência detectada",
        description:
          "Divergência entre os dados filtrados e o relatório. Atualize a página e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    try {
      const logoDataUrl = await loadImageDataUrl(mcLogo.url);
      let chartContractDataUrl: string | null = null;
      let chartParecerDataUrl: string | null = null;
      if (opts.graficos) {
        if (chartContract && chartContract.length) {
          chartContractDataUrl = renderBarChart(chartContract, { title: "Custos por Contrato" });
        }
        if (chartParecer && chartParecer.length) {
          chartParecerDataUrl = renderPieChart(chartParecer, { title: "Distribuição por Parecer" });
        }
      }
      const fullMeta: PdfMeta = {
        ...meta,
        logoDataUrl,
        chartContractDataUrl,
        chartParecerDataUrl,
      };
      const doc = generatePdfReport(data, filters, opts, fullMeta);
      doc.save(buildFileName(filters));
      toast({ title: "Relatório gerado", description: "PDF executivo salvo com sucesso." });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e?.message || "Erro inesperado.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const Item = ({ k, label }: { k: keyof PdfOptions; label: string }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox
        checked={opts[k] as boolean}
        onCheckedChange={(v) => set(k, !!v as any)}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Relatório Executivo</DialogTitle>
          <DialogDescription>
            {data.length} registro(s) serão incluídos com base nos filtros aplicados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          <Item k="resumoExecutivo" label="Resumo executivo" />
          <Item k="graficos" label="Incluir gráficos" />
          <Item k="analiseContrato" label="Análise por contrato" />
          <Item k="analiseCategoria" label="Análise por parecer/criticidade" />
          <Item k="rankingPlacas" label="Ranking de placas" />
          <Item k="tabelaDetalhada" label="Tabela detalhada" />
          <Item k="semNF" label="Registros sem NF" />
          <Item k="semParecer" label="Registros sem parecer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="obs" className="text-sm">Observações adicionais para o relatório</Label>
          <Textarea
            id="obs"
            rows={3}
            placeholder="Ex.: Relatório gerado para alinhamento comercial referente às avarias pendentes..."
            value={opts.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !data.length}>
            {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
