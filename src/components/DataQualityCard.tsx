import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileX, HelpCircle, Car, FileText, CalendarX, ShieldCheck } from "lucide-react";
import type { Avaria } from "@/data/avarias";

interface Props {
  data: Avaria[];
  onFilterSemNF?: () => void;
  onFilterSemParecer?: () => void;
}

export function DataQualityCard({ data, onFilterSemNF, onFilterSemParecer }: Props) {
  const semNF = data.filter((a) => !a.nf || !String(a.nf).trim()).length;
  const semParecer = data.filter(
    (a) => !a.parecer || !String(a.parecer).trim() || a.categoria === "Sem Parecer",
  ).length;
  const semPlaca = data.filter((a) => !a.placa || !String(a.placa).trim()).length;
  const semContrato = data.filter((a) => !a.contrato || !String(a.contrato).trim()).length;
  const semData = data.filter((a) => !a.dataEnvio || !String(a.dataEnvio).trim()).length;

  const total = data.length || 1;

  const items = [
    { label: "Sem NF", count: semNF, icon: FileX, onClick: onFilterSemNF },
    { label: "Sem parecer", count: semParecer, icon: HelpCircle, onClick: onFilterSemParecer },
    { label: "Sem placa", count: semPlaca, icon: Car },
    { label: "Sem contrato", count: semContrato, icon: FileText },
    { label: "Sem data de envio", count: semData, icon: CalendarX },
  ];

  const toneFor = (count: number, label: string) => {
    if (count === 0) return "ok";
    const ratio = count / total;
    if (label === "Sem NF" || label === "Sem parecer") {
      return ratio > 0.2 ? "danger" : "warning";
    }
    return ratio > 0.05 ? "danger" : "warning";
  };

  const toneStyles: Record<string, string> = {
    ok: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300",
    danger: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  const iconStyles: Record<string, string> = {
    ok: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Qualidade dos dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((item) => {
            const tone = toneFor(item.count, item.label);
            const Icon = item.count === 0 ? CheckCircle2 : item.icon;
            const clickable = !!item.onClick && item.count > 0;
            return (
              <button
                key={item.label}
                type="button"
                onClick={clickable ? item.onClick : undefined}
                disabled={!clickable}
                className={`rounded-lg border p-3 text-left transition ${toneStyles[tone]} ${
                  clickable ? "hover:shadow-sm cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`h-4 w-4 ${iconStyles[tone]}`} />
                  <span className="text-xl font-bold tabular-nums">{item.count}</span>
                </div>
                <div className="text-xs font-medium">{item.label}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
