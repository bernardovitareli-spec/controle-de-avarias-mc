import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "muted";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-[hsl(var(--success))]/10", text: "text-[hsl(var(--success))]" },
  warning: { bg: "bg-[hsl(var(--warning))]/10", text: "text-[hsl(var(--warning))]" },
  danger:  { bg: "bg-[hsl(var(--danger))]/10",  text: "text-[hsl(var(--danger))]"  },
  info:    { bg: "bg-[hsl(var(--info))]/10",    text: "text-[hsl(var(--info))]"    },
  muted:   { bg: "bg-muted",                    text: "text-muted-foreground"      },
};

export function KPICard({ title, value, subtitle, icon: Icon, className, iconClassName, tone = "primary" }: KPICardProps) {
  const t = toneStyles[tone];
  return (
    <Card className={cn("relative overflow-hidden shadow-card hover:shadow-elevated transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3 shrink-0", t.bg, iconClassName)}>
            <Icon className={cn("h-5 w-5", t.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
