import { useState, useMemo } from "react";
import { avariasData } from "@/data/avarias";
import { KPICard } from "@/components/KPICard";
import { AvariasTable } from "@/components/AvariasTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DollarSign, Truck, Clock, AlertTriangle, FileText, Filter } from "lucide-react";

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
  const [filterContrato, setFilterContrato] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  const filtered = useMemo(() => {
    return avariasData.filter((a) => {
      if (filterContrato !== "all" && a.contrato !== filterContrato) return false;
      if (filterCategoria !== "all" && a.categoria !== filterCategoria) return false;
      return true;
    });
  }, [filterContrato, filterCategoria]);

  const totalValor = filtered.reduce((s, a) => s + a.valor, 0);
  const totalItens = filtered.length;
  const avgAtraso = Math.round(filtered.reduce((s, a) => s + a.diasAtraso, 0) / (filtered.length || 1));
  const maxAtraso = Math.max(...filtered.map((a) => a.diasAtraso), 0);

  const contratos = [...new Set(avariasData.map((a) => a.contrato))];
  const categorias = [...new Set(avariasData.map((a) => a.categoria))];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestão de Avarias — Ápia</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Painel executivo · Atualizado em {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
              <AlertTriangle className="h-3 w-3" />
              {avariasData.filter((a) => a.diasAtraso > 180).length} avarias críticas (&gt;180 dias)
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Valor Total"
            value={formatCurrency(totalValor)}
            subtitle={`${totalItens} avarias registradas`}
            icon={DollarSign}
          />
          <KPICard
            title="Contratos Ativos"
            value={String(contratos.length)}
            subtitle="SALOBO · SLB · CKS"
            icon={FileText}
          />
          <KPICard
            title="Atraso Médio"
            value={`${avgAtraso} dias`}
            subtitle="Desde envio da avaria"
            icon={Clock}
            iconClassName="bg-[hsl(var(--warning))]/10"
          />
          <KPICard
            title="Maior Atraso"
            value={`${maxAtraso} dias`}
            subtitle="Avaria mais antiga pendente"
            icon={AlertTriangle}
            iconClassName="bg-destructive/10"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
              <Select value={filterContrato} onValueChange={setFilterContrato}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Contratos</SelectItem>
                  {contratos.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filterContrato !== "all" || filterCategoria !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterContrato("all"); setFilterCategoria("all"); }}
                  className="text-xs"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
                    {byContract.map((entry) => (
                      <Cell key={entry.name} fill={CONTRACT_COLORS[entry.name] || "hsl(var(--primary))"} />
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
          {contratos.map((contrato) => {
            const items = filtered.filter((a) => a.contrato === contrato);
            if (items.length === 0) return null;
            const total = items.reduce((s, a) => s + a.valor, 0);
            const avgD = Math.round(items.reduce((s, a) => s + a.diasAtraso, 0) / items.length);
            const critical = items.filter((a) => a.diasAtraso > 90).length;

            return (
              <Card key={contrato} className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: CONTRACT_COLORS[contrato] }}
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
          <AvariasTable data={filtered} />
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t">
          Dados extraídos da planilha Avarias - Ápia · Referência: {new Date().toLocaleDateString("pt-BR")}
        </footer>
      </main>
    </div>
  );
};

export default Index;
