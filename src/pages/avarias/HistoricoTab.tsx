import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";
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
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma importação registrada ainda.
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
