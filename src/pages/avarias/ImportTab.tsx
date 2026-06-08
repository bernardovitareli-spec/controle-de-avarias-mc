import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseWorkbook, type SheetParseFull } from "@/modules/avarias/parseSheet";
import { normalizeStatus, normalizeParecer } from "@/modules/avarias/normalize";
import { classifyAvaria } from "@/modules/avarias/classify";
import { buildDuplicateKey } from "@/modules/avarias/duplicateKey";
import { formatCurrency, formatDateBR } from "@/modules/avarias/utils";
import type { ParsedRow } from "@/modules/avarias/types";

interface ParsedState {
  fileName: string;
  sheets: SheetParseFull[];
  allRows: ParsedRow[];
  duplicadosExistentes: number;
}

export default function ImportTab({ onImported }: { onImported: () => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (f: File) => {
    setLoading(true);
    setError(null);
    setParsed(null);
    setFile(f);
    try {
      const { sheets, allRows } = await parseWorkbook(f);

      // checar duplicidades já no banco
      const keys = allRows.map((r) =>
        buildDuplicateKey({
          data_envio: r.data_envio,
          placa: r.placa,
          contrato: r.contrato,
          valor: r.valor,
          nf_mc: r.nf_mc,
          observacoes: r.observacoes,
        })
      );
      let duplicadosExistentes = 0;
      if (keys.length) {
        // Buscar em chunks para evitar URL muito grande
        const chunkSize = 200;
        const existing = new Set<string>();
        for (let i = 0; i < keys.length; i += chunkSize) {
          const slice = keys.slice(i, i + chunkSize);
          const { data, error: err } = await supabase
            .from("avarias_registros")
            .select("chave_duplicidade")
            .in("chave_duplicidade", slice);
          if (err) throw err;
          data?.forEach((d) => d.chave_duplicidade && existing.add(d.chave_duplicidade));
        }
        duplicadosExistentes = keys.filter((k) => existing.has(k)).length;
      }

      setParsed({ fileName: f.name, sheets, allRows, duplicadosExistentes });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Falha ao ler o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const summary = useMemo(() => {
    if (!parsed) return null;
    const rows = parsed.allRows;
    const totalLinhasLidas = parsed.sheets.reduce((a, s) => a + s.totalLinhas, 0);
    const ignoradas = parsed.sheets.reduce((a, s) => a + s.ignoradas, 0);
    const valorTotal = rows.reduce((a, r) => a + (r.valor || 0), 0);
    const contratos = new Set(rows.map((r) => r.contrato).filter(Boolean));
    const placas = new Set(rows.map((r) => r.placa).filter(Boolean));
    const semNF = rows.filter((r) => !r.nf_mc).length;
    const semParecer = rows.filter((r) => !r.parecer_original).length;
    const missing = parsed.sheets.flatMap((s) => s.missingRequired.map((m) => `${s.abaName}: ${m}`));
    return {
      totalLinhasLidas,
      validos: rows.length,
      ignoradas,
      duplicados: parsed.duplicadosExistentes,
      valorTotal,
      contratos: contratos.size,
      placas: placas.size,
      semNF,
      semParecer,
      missingRequired: Array.from(new Set(missing)),
    };
  }, [parsed]);

  const canConfirm = !!parsed && parsed.allRows.length > 0 && (summary?.missingRequired.length ?? 0) === 0;

  const confirmar = async () => {
    if (!parsed || !file || !summary) return;
    setSaving(true);
    try {
      const registros = parsed.allRows.map((r) => {
        const chave = buildDuplicateKey({
          data_envio: r.data_envio,
          placa: r.placa,
          contrato: r.contrato,
          valor: r.valor,
          nf_mc: r.nf_mc,
          observacoes: r.observacoes,
        });
        return {
          data_envio: r.data_envio,
          placa: r.placa || null,
          contrato: r.contrato || null,
          status_original: r.status_original,
          status_normalizado: normalizeStatus(r.status_original),
          nf_mc: r.nf_mc,
          valor: r.valor,
          parecer_original: r.parecer_original,
          parecer_normalizado: normalizeParecer(r.parecer_original),
          observacoes: r.observacoes,
          categoria: classifyAvaria(r.observacoes),
          chave_duplicidade: chave,
        };
      });

      const { data, error } = await supabase.rpc("create_avarias_import", {
        p_nome_arquivo: file.name,
        p_total_linhas_lidas: summary.totalLinhasLidas,
        p_total_registros_ignorados: summary.ignoradas,
        p_valor_total_importado: summary.valorTotal,
        p_registros: registros as any,
      });
      if (error) throw error;

      const result = (data ?? {}) as { importacao_id?: string; inseridos?: number; duplicados?: number };
      const inseridos = result.inseridos ?? 0;
      const duplicados = result.duplicados ?? 0;

      toast({
        title: "Importação concluída",
        description: `${inseridos} registros inseridos · ${duplicados} duplicidades ignoradas.`,
      });
      reset();
      onImported();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro na importação",
        description: e?.message ?? "Falha ao gravar dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Importar Planilha de Avarias
          </CardTitle>
          <CardDescription>
            Aceita arquivos .xlsx, .xls e .csv. Cada aba pode representar um contrato distinto.
            O sistema lê todas as abas, valida colunas e mostra uma prévia antes de gravar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onPick}
              className="hidden"
            />
            <Button onClick={() => inputRef.current?.click()} disabled={loading || saving}>
              <Upload className="h-4 w-4 mr-2" /> Selecionar Arquivo
            </Button>
            {file && (
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={reset} disabled={loading || saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {loading && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo…
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao ler arquivo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {summary && summary.missingRequired.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Colunas obrigatórias ausentes</AlertTitle>
              <AlertDescription>
                As seguintes colunas obrigatórias não foram encontradas:
                <ul className="list-disc pl-5 mt-1">
                  {summary.missingRequired.map((m) => (
                    <li key={m}><code>{m}</code></li>
                  ))}
                </ul>
                Esperado: DIA/DATA, PLACA, CONTRATO, VALOR.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsed && summary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Importação</CardTitle>
              <CardDescription>
                Confira os totais antes de confirmar a gravação no banco.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Linhas lidas" value={summary.totalLinhasLidas} />
                <Stat label="Registros válidos" value={summary.validos} />
                <Stat label="Linhas ignoradas" value={summary.ignoradas} />
                <Stat label="Duplicidades" value={summary.duplicados} highlight={summary.duplicados > 0} />
                <Stat label="Valor total" value={formatCurrency(summary.valorTotal)} />
                <Stat label="Contratos" value={summary.contratos} />
                <Stat label="Placas" value={summary.placas} />
                <Stat label="Sem NF MC" value={summary.semNF} />
                <Stat label="Sem parecer" value={summary.semParecer} />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {parsed.sheets.map((s) => (
                  <Badge key={s.abaName} variant="secondary">
                    {s.abaName}: {s.rows.length} reg. {s.contratoDetectado ? `(contrato ${s.contratoDetectado})` : ""}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prévia dos Dados</CardTitle>
              <CardDescription>Mostrando as primeiras 10 linhas processadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>NF MC</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Parecer</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.allRows.slice(0, 10).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDateBR(r.data_envio)}</TableCell>
                        <TableCell>{r.placa || "—"}</TableCell>
                        <TableCell>{r.contrato || "—"}</TableCell>
                        <TableCell>{r.status_original || "—"}</TableCell>
                        <TableCell>{r.nf_mc || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.valor)}</TableCell>
                        <TableCell>{r.parecer_original || "—"}</TableCell>
                        <TableCell className="max-w-[280px] truncate" title={r.observacoes ?? ""}>
                          {r.observacoes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={reset} disabled={saving}>
              Cancelar / Limpar
            </Button>
            <Button onClick={confirmar} disabled={!canConfirm || saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gravando…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar Importação</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-amber-500/50 bg-amber-500/5" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
