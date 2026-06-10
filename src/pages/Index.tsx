import { useState, useMemo } from "react";
import { avariasData as mockAvariasData } from "@/data/avarias";
import { useAvariasData } from "@/modules/avarias/useAvariasData";
import { KPICard } from "@/components/KPICard";
import { AvariasTable } from "@/components/AvariasTable";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Truck, Clock, AlertTriangle, FileText, Filter, X, FileDown, RefreshCw, Inbox, FileX, HelpCircle, Flame, Database } from "lucide-react";
import { MultiSelect } from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criticidade as critOf } from "@/modules/avarias/utils";
import { PdfReportDialog } from "@/components/PdfReportDialog";

import { EditAvariaDialog, EditAvariaTarget } from "@/components/EditAvariaDialog";
import { useUserRole } from "@/hooks/useUserRole";

const CATEGORY_COLORS: Record<string, string> = {
  "Concluído": "hsl(142, 71%, 45%)",
  "Fechado": "hsl(220, 10%, 55%)",
  "Acordado": "hsl(220, 70%, 50%)",
  "Reposição": "hsl(38, 92%, 50%)",
  "À Negociar": "hsl(0, 72%, 51%)",
  "À Enviar": "hsl(25, 95%, 55%)",
  "Pendente Assinatura": "hsl(280, 65%, 60%)",
  "Sem Parecer": "hsl(220, 10%, 70%)",
};

// Paleta cíclica para os 24 contratos
const CONTRACT_PALETTE = [
  "hsl(220, 70%, 50%)", "hsl(160, 60%, 45%)", "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)", "hsl(190, 80%, 45%)",
  "hsl(45, 90%, 50%)", "hsl(340, 75%, 55%)", "hsl(120, 50%, 45%)",
  "hsl(260, 60%, 55%)", "hsl(15, 85%, 55%)", "hsl(200, 65%, 45%)",
];
const getContractColor = (name: string, idx: number) =>
  CONTRACT_PALETTE[idx % CONTRACT_PALETTE.length];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Index = () => {
  const [filterContratos, setFilterContratos] = useState<string[]>([]);
  const [filterPareceres, setFilterPareceres] = useState<string[]>([]);
  const [filterPlacas, setFilterPlacas] = useState<string[]>([]);
  const [filterCriticidades, setFilterCriticidades] = useState<string[]>([]);
  const [filterNF, setFilterNF] = useState<string[]>([]);
  const [dataInicial, setDataInicial] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [editTarget, setEditTarget] = useState<EditAvariaTarget | null>(null);
  const { podeEditar } = useUserRole();

  const { loading, hasReal, importacao, importacoes, rows: realRows, semNF, semParecer, refresh } = useAvariasData();
  const avariasData = hasReal ? realRows : mockAvariasData;

  const filtered = useMemo(() => {
    return avariasData.filter((a) => {
      if (filterContratos.length && !filterContratos.includes(a.contrato)) return false;
      if (filterPareceres.length && !filterPareceres.includes(a.categoria)) return false;
      if (filterPlacas.length && !filterPlacas.includes(a.placa)) return false;
      if (filterCriticidades.length && !filterCriticidades.includes(critOf(a.diasAtraso))) return false;
      if (filterNF.length) {
        const hasNF = !!(a.nf && String(a.nf).trim());
        const want = filterNF.includes("Com NF");
        const wantNo = filterNF.includes("Sem NF");
        if (want && !wantNo && !hasNF) return false;
        if (wantNo && !want && hasNF) return false;
      }
      if (dataInicial && (!a.dataEnvio || a.dataEnvio < dataInicial)) return false;
      if (dataFinal && (!a.dataEnvio || a.dataEnvio > dataFinal)) return false;
      return true;
    });
  }, [avariasData, filterContratos, filterPareceres, filterPlacas, filterCriticidades, filterNF, dataInicial, dataFinal]);

  const totalValor = filtered.reduce((s, a) => s + a.valor, 0);
  const totalItens = filtered.length;
  const avgAtraso = Math.round(filtered.reduce((s, a) => s + a.diasAtraso, 0) / (filtered.length || 1));
  const maxAtraso = Math.max(...filtered.map((a) => a.diasAtraso), 0);
  const semNFFiltered = filtered.filter((a) => !a.nf || !String(a.nf).trim()).length;
  const semParecerFiltered = filtered.filter((a) => !a.parecer || !String(a.parecer).trim() || a.categoria === "Sem Parecer").length;
  const criticasFiltered = filtered.filter((a) => critOf(a.diasAtraso) === "Crítica").length;

  const contratos: string[] = useMemo(() => [...new Set(avariasData.map((a) => a.contrato))].sort(), [avariasData]);
  const categorias: string[] = useMemo(() => [...new Set(avariasData.map((a) => a.categoria))].sort(), [avariasData]);
  const placas: string[] = useMemo(() => [...new Set(avariasData.map((a) => a.placa))].sort(), [avariasData]);
  const criticidades = ["Baixa", "Média", "Alta", "Crítica"];

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...filterContratos.map((v) => ({ label: `Contrato: ${v}`, onRemove: () => setFilterContratos(filterContratos.filter((x) => x !== v)) })),
    ...filterPareceres.map((v) => ({ label: `Parecer: ${v}`, onRemove: () => setFilterPareceres(filterPareceres.filter((x) => x !== v)) })),
    ...filterPlacas.map((v) => ({ label: `Placa: ${v}`, onRemove: () => setFilterPlacas(filterPlacas.filter((x) => x !== v)) })),
    ...filterCriticidades.map((v) => ({ label: `Criticidade: ${v}`, onRemove: () => setFilterCriticidades(filterCriticidades.filter((x) => x !== v)) })),
    ...filterNF.map((v) => ({ label: `NF: ${v}`, onRemove: () => setFilterNF(filterNF.filter((x) => x !== v)) })),
    ...(dataInicial ? [{ label: `De: ${dataInicial}`, onRemove: () => setDataInicial("") }] : []),
    ...(dataFinal ? [{ label: `Até: ${dataFinal}`, onRemove: () => setDataFinal("") }] : []),
  ];
  const hasAnyFilter = activeChips.length > 0;
  const clearAll = () => {
    setFilterContratos([]); setFilterPareceres([]); setFilterPlacas([]);
    setFilterCriticidades([]); setFilterNF([]);
    setDataInicial(""); setDataFinal("");
  };

  // Chart data: by contract
  const byContract = contratos.map((c) => {
    const items = filtered.filter((a) => a.contrato === c);
    return { name: c, valor: items.reduce((s, a) => s + a.valor, 0), qtd: items.length };
  }).filter((d) => d.qtd > 0);

  // Chart data: by category
  const byCategory = categorias.map((c) => {
    const items = filtered.filter((a) => a.categoria === c);
    return { name: c, valor: items.reduce((s, a) => s + a.valor, 0), qtd: items.length };
  }).filter((d) => d.qtd > 0);

  const chartConfig = {
    valor: { label: "Valor (R$)", color: "hsl(var(--primary))" },
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        title="Dashboard de Avarias"
        subtitle="Visão consolidada dos lotes importados, com KPIs, gráficos e detalhamento."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4 mr-1.5" /> Filtros
            </Button>
            <Button size="sm" onClick={() => setPdfOpen(true)} disabled={!filtered.length}>
              <FileDown className="h-4 w-4 mr-1.5" /> Gerar Relatório PDF
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* Origem dos dados / auditoria */}
        <div className={`rounded-md border px-4 py-2.5 text-xs flex flex-wrap items-center gap-x-4 gap-y-1 ${hasReal ? "bg-muted/40" : "bg-amber-500/10 border-amber-500/30"}`}>
          {loading ? (
            <span className="text-muted-foreground">Carregando dados…</span>
          ) : hasReal ? (
            <>
              <Database className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Base consolidada</span>
              <span className="text-muted-foreground">{importacoes.length} importações</span>
              <span className="text-muted-foreground">{realRows.length} registros</span>
              <span className="text-muted-foreground">Sem NF: {semNF}</span>
              <span className="text-muted-foreground">Sem parecer: {semParecer}</span>
              {importacao && (
                <span className="text-muted-foreground ml-auto">
                  Última: {new Date(importacao.data_importacao).toLocaleDateString("pt-BR")}
                </span>
              )}
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-300">Nenhuma importação real encontrada — exibindo dados de exemplo.</span>
              <a href="/avarias" className="underline ml-auto">Importar planilha</a>
            </>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Valor Total"
            value={formatCurrency(totalValor)}
            subtitle={`${totalItens} avarias registradas`}
            icon={DollarSign}
            tone="success"
          />
          <KPICard
            title="Contratos"
            value={String(contratos.length)}
            subtitle={`${avariasData.length} avarias na base`}
            icon={FileText}
            tone="info"
          />
          <KPICard
            title="Atraso Médio"
            value={`${avgAtraso} dias`}
            subtitle="Desde envio da avaria"
            icon={Clock}
            tone="warning"
          />
          <KPICard
            title="Maior Atraso"
            value={`${maxAtraso} dias`}
            subtitle="Avaria mais antiga pendente"
            icon={AlertTriangle}
            tone="danger"
          />
          <KPICard
            title="Sem NF"
            value={String(semNFFiltered)}
            subtitle="Avarias sem nota fiscal"
            icon={FileX}
            tone="warning"
          />
          <KPICard
            title="Sem Parecer"
            value={String(semParecerFiltered)}
            subtitle="Aguardando análise"
            icon={HelpCircle}
            tone="muted"
          />
          <KPICard
            title="Avarias Críticas"
            value={String(criticasFiltered)}
            subtitle="Atraso acima do limite"
            icon={Flame}
            tone="danger"
          />
        </div>

        {/* Filters */}
        {showFilters && (
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground mr-1">Filtros:</span>
              <MultiSelect
                options={contratos}
                selected={filterContratos}
                onChange={setFilterContratos}
                placeholder="Todos os Contratos"
                label="contratos"
              />
              <MultiSelect
                options={categorias}
                selected={filterPareceres}
                onChange={setFilterPareceres}
                placeholder="Todos os Pareceres"
                label="pareceres"
              />
              <MultiSelect
                options={placas}
                selected={filterPlacas}
                onChange={setFilterPlacas}
                placeholder="Todas as Placas"
                label="placas"
              />
              <MultiSelect
                options={criticidades}
                selected={filterCriticidades}
                onChange={setFilterCriticidades}
                placeholder="Toda Criticidade"
                label="criticidades"
                searchable={false}
                width="w-[180px]"
              />
              <MultiSelect
                options={["Com NF", "Sem NF"]}
                selected={filterNF}
                onChange={setFilterNF}
                placeholder="NF (todos)"
                label="opções"
                searchable={false}
                width="w-[160px]"
              />
              <div className="flex items-center gap-1.5">
                <Label htmlFor="data-ini" className="text-xs text-muted-foreground">De</Label>
                <Input
                  id="data-ini"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="h-9 w-[150px]"
                />
                <Label htmlFor="data-fim" className="text-xs text-muted-foreground">Até</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="h-9 w-[150px]"
                />
              </div>
              {hasAnyFilter && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs ml-auto">
                  <X className="h-3 w-3 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
              <span className="text-xs text-muted-foreground mr-1 mt-1">Aplicados:</span>
              {!hasAnyFilter && (
                <span className="text-xs text-muted-foreground italic mt-1">
                  Nenhum filtro aplicado — exibindo base consolidada completa.
                </span>
              )}
              {activeChips.map((c) => (
                <Badge key={c.label} variant="secondary" className="gap-1 pr-1 mt-1">
                  {c.label}
                  <button
                    onClick={c.onRemove}
                    className="hover:bg-background/50 rounded-sm p-0.5"
                    aria-label={`Remover ${c.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Contract Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Custos por Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={byContract} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {byContract.map((entry, idx) => (
                      <Cell key={entry.name} fill={getContractColor(entry.name, idx)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* By Category Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Distribuição por Parecer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ChartContainer config={chartConfig} className="h-[280px] flex-1">
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Pie
                      data={byCategory}
                      dataKey="valor"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      strokeWidth={2}
                    >
                      {byCategory.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "hsl(var(--muted))"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2 min-w-[140px]">
                  {byCategory.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <div
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.name] }}
                      />
                      <span className="text-muted-foreground flex-1">{c.name}</span>
                      <span className="font-medium tabular-nums">{c.qtd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contratos.map((contrato, idx) => {
            const items = filtered.filter((a) => a.contrato === contrato);
            if (items.length === 0) return null;
            const total = items.reduce((s, a) => s + a.valor, 0);
            const avgD = Math.round(items.reduce((s, a) => s + a.diasAtraso, 0) / items.length);
            const critical = items.filter((a) => a.diasAtraso > 90).length;

            return (
              <Card key={contrato} className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: getContractColor(contrato, idx) }}
                />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{contrato}</h3>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(total)}</p>
                    </div>
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{items.length} avarias</span>
                    <span>Atraso médio: {avgD}d</span>
                    {critical > 0 && (
                      <span className="text-destructive font-medium">{critical} críticas</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Detalhamento de Avarias</h2>
          <AvariasTable
            data={filtered}
            onEdit={
              hasReal && podeEditar
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
        </div>

        <EditAvariaDialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
          target={editTarget}
        />

        <footer className="text-center text-xs text-muted-foreground py-4 border-t">
          Dados extraídos da planilha Avarias - Ápia · Referência: {new Date().toLocaleDateString("pt-BR")}
        </footer>
      </div>

      <PdfReportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        data={filtered}
        filters={{
          contratos: filterContratos,
          pareceres: filterPareceres,
          placas: filterPlacas,
          criticidades: filterCriticidades,
          nf: filterNF,
        }}
        meta={{
          importacaoNome: importacao?.nome_arquivo,
          importacaoData: importacao?.data_importacao,
          totalImportacao: hasReal ? realRows.length : undefined,
        }}
        totalDashboard={filtered.length}
      />
    </div>
  );
};

export default Index;
