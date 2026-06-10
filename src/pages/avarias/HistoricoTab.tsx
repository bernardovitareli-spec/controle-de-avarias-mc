import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/modules/avarias/utils";
import type { AvariaImportacao } from "@/modules/avarias/types";

export default function HistoricoTab() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AvariaImportacao[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("avarias_importacoes")
        .select("*")
        .order("data_importacao", { ascending: false });
      if (!error && data) setItems(data as any);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de Importações
        </CardTitle>
        <CardDescription>Lotes de avarias importados para o módulo.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">Nenhuma importação ainda</p>
            <p className="text-xs mt-1">Importe uma planilha na aba acima para começar.</p>
          </div>
        ) : (
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Lidas</TableHead>
                  <TableHead className="text-right">Válidas</TableHead>
                  <TableHead className="text-right">Ignoradas</TableHead>
                  <TableHead className="text-right">Duplicadas</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.nome_arquivo}</TableCell>
                    <TableCell>{new Date(it.data_importacao).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{it.total_linhas_lidas}</TableCell>
                    <TableCell className="text-right">{it.total_registros_validos}</TableCell>
                    <TableCell className="text-right">{it.total_registros_ignorados}</TableCell>
                    <TableCell className="text-right">{it.total_duplicados}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(it.valor_total_importado))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{it.status_importacao}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
