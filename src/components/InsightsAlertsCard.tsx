import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Flame, FileX, HelpCircle, Handshake, Trophy, CheckCircle2, Lightbulb } from "lucide-react";
import type { Avaria } from "@/data/avarias";
import { criticidade as critOf } from "@/modules/avarias/utils";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Alert {
  icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  tone: "danger" | "warning" | "info" | "muted";
}

export function InsightsAlertsCard({ data }: { data: Avaria[] }) {
  const alerts: Alert[] = [];

  const criticas = data.filter((a) => a.diasAtraso > 180);
  if (criticas.length) {
    alerts.push({
      icon: Flame,
      tone: "danger",
      text: (
        <>
          <strong>{criticas.length}</strong> avaria(s) crítica(s) (mais de 180 dias) somando{" "}
          <strong>{formatCurrency(criticas.reduce((s, a) => s + a.valor, 0))}</strong>.
        </>
      ),
    });
  }

  const semParecer30 = data.filter(
    (a) => (!a.parecer || !String(a.parecer).trim() || a.categoria === "Sem Parecer") && a.diasAtraso > 30,
  );
  if (semParecer30.length) {
    alerts.push({
      icon: HelpCircle,
      tone: "warning",
      text: (
        <>
          <strong>{semParecer30.length}</strong> avaria(s) sem parecer há mais de 30 dias.
        </>
      ),
    });
  }

  const semNF = data.filter((a) => !a.nf || !String(a.nf).trim());
  if (semNF.length) {
    alerts.push({
      icon: FileX,
      tone: "warning",
      text: (
        <>
          <strong>{semNF.length}</strong> avaria(s) sem NF somando{" "}
          <strong>{formatCurrency(semNF.reduce((s, a) => s + a.valor, 0))}</strong>.
        </>
      ),
    });
  }

  const negociar = data.filter((a) => a.categoria === "À Negociar");
  if (negociar.length) {
    alerts.push({
      icon: Handshake,
      tone: "info",
      text: (
        <>
          Valor total "À Negociar":{" "}
          <strong>{formatCurrency(negociar.reduce((s, a) => s + a.valor, 0))}</strong> ({negociar.length} avarias).
        </>
      ),
    });
  }

  const porContrato = new Map<string, number>();
  data.forEach((a) => porContrato.set(a.contrato, (porContrato.get(a.contrato) || 0) + a.valor));
  let maiorContrato: { nome: string; valor: number } | null = null;
  porContrato.forEach((valor, nome) => {
    if (!maiorContrato || valor > maiorContrato.valor) maiorContrato = { nome, valor };
  });
  if (maiorContrato) {
    alerts.push({
      icon: Trophy,
      tone: "info",
      text: (
        <>
          Contrato com maior valor de avarias: <strong>{maiorContrato.nome}</strong> (
          {formatCurrency(maiorContrato.valor)}).
        </>
      ),
    });
  }

  // Sort: danger first, then warning, then others
  const order = { danger: 0, warning: 1, info: 2, muted: 3 };
  alerts.sort((a, b) => order[a.tone] - order[b.tone]);

  const toneClasses: Record<Alert["tone"], string> = {
    danger: "bg-destructive/5 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300",
    info: "bg-muted/40 border-border text-foreground",
    muted: "bg-muted/30 border-border text-muted-foreground",
  };

  const iconColor: Record<Alert["tone"], string> = {
    danger: "text-destructive",
    warning: "text-amber-600",
    info: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Insights e Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Nenhum alerta no momento.
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const Icon = alert.icon;
            // First alert (highest priority) always highlighted amber
            const tone = idx === 0 ? "warning" : alert.tone;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm ${toneClasses[tone]}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor[tone]}`} />
                <span className="leading-relaxed">{alert.text}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
