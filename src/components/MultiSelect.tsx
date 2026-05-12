import { useState, useMemo } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  width?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Todos",
  label,
  searchable = true,
  width = "w-[220px]",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filteredOpts = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, q]);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  const display =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} ${label ?? "selecionados"}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(width, "h-9 justify-between font-normal")}
        >
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
            {display}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        {searchable && options.length > 6 && (
          <div className="p-2 border-b flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar..."
              className="h-7 text-xs border-0 focus-visible:ring-0 px-1"
            />
          </div>
        )}
        <div className="max-h-[260px] overflow-y-auto py-1">
          {filteredOpts.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              Nenhum resultado
            </div>
          )}
          {filteredOpts.map((opt) => {
            const isSel = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent text-left"
              >
                <Checkbox checked={isSel} className="pointer-events-none" />
                <span className="flex-1 truncate">{opt}</span>
                {isSel && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => onChange([])}
            >
              <X className="h-3 w-3 mr-1" /> Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
