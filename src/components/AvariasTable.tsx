import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avaria } from "@/data/avarias";
import { ArrowUpDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvariasTableProps {
  data: Avaria[];
  onEdit?: (item: Avaria) => void;
}

function getDelayColor(dias: number) {
  if (dias > 180) return "bg-destructive/15 text-destructive border-destructive/30";
  if (dias > 90) return "bg-[hsl(var(--danger))]/10 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30";
  if (dias > 30) return "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30";
  return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30";
}

function getCategoriaColor(cat: string) {
  switch (cat) {
    case "Concluído": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Fechado": return "bg-slate-100 text-slate-700 border-slate-200";
    case "Acordado": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Reposição": return "bg-amber-100 text-amber-800 border-amber-200";
    case "À Negociar": return "bg-red-100 text-red-800 border-red-200";
    case "À Enviar": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Pendente Assinatura": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-muted text-muted-foreground";
  }
}

type SortField = "dataEnvio" | "valor" | "diasAtraso" | "placa";

export function AvariasTable({ data, onEdit }: AvariasTableProps) {
  const [sortField, setSortField] = useState<SortField>("diasAtraso");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortField === "valor" || sortField === "diasAtraso") {
        return (a[sortField] - b[sortField]) * mult;
      }
      return a[sortField].localeCompare(b[sortField]) * mult;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => toggleSort("dataEnvio")} className="h-8 -ml-3 font-semibold">
                Data Envio <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => toggleSort("placa")} className="h-8 -ml-3 font-semibold">
                Placa <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Contrato</TableHead>
            <TableHead className="font-semibold">Categoria</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => toggleSort("valor")} className="h-8 -ml-3 font-semibold">
                Valor <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => toggleSort("diasAtraso")} className="h-8 -ml-3 font-semibold">
                Dias Atraso <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Observações</TableHead>
            {onEdit && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-sm">{item.dataEnvio ? formatDate(item.dataEnvio) : "—"}</TableCell>
              <TableCell className="font-mono font-medium">{item.placa}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs whitespace-nowrap">{item.contrato}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs border whitespace-nowrap", getCategoriaColor(item.categoria))}>
                  {item.categoria}
                </Badge>
              </TableCell>
              <TableCell className="font-mono font-semibold text-right whitespace-nowrap">
                {formatCurrency(item.valor)}
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs font-bold border tabular-nums", getDelayColor(item.diasAtraso))}>
                  {item.diasAtraso}d
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={item.observacoes}>
                {item.observacoes}
              </TableCell>
              {onEdit && (
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
