import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { diasAtraso } from "./utils";
import { normalizeStatus, normalizeParecer } from "./normalize";
import { classifyAvaria } from "./classify";
import type { Avaria } from "@/data/avarias";
import type { AvariaImportacao } from "./types";

const normTxt = (v?: string | null) =>
  (v ?? "").trim().toUpperCase().replace(/\s+/g, " ");

export interface AvariasDataState {
  loading: boolean;
  hasReal: boolean;
  importacao: AvariaImportacao | null;
  rows: Avaria[];
  semNF: number;
  semParecer: number;
  error: Error | null;
  refresh: () => void;
}

interface AvariasQueryResult {
  importacao: AvariaImportacao | null;
  rows: Avaria[];
  semNF: number;
  semParecer: number;
}

const QUERY_KEY = ["avarias", "latest"] as const;

async function fetchLatestAvarias(): Promise<AvariasQueryResult> {
  const { data: imps, error: impErr } = await supabase
    .from("avarias_importacoes")
    .select("*")
    .in("status_importacao", ["confirmada", "concluida"])
    .order("data_importacao", { ascending: false })
    .limit(1);

  if (impErr) throw impErr;

  const imp = imps?.[0] ?? null;
  if (!imp) {
    return { importacao: null, rows: [], semNF: 0, semParecer: 0 };
  }

  const all: any[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("avarias_registros")
      .select("*")
      .eq("importacao_id", imp.id)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const mapped: Avaria[] = all.map((r) => {
    const contrato = normTxt(r.contrato) || "—";
    const placa = normTxt(r.placa) || "—";
    const parecer =
      r.parecer_normalizado || normalizeParecer(r.parecer_original);
    const status = r.status_normalizado || normalizeStatus(r.status_original);
    const categoria = r.categoria || classifyAvaria(r.observacoes);
    return {
      id: r.id,
      dataEnvio: r.data_envio ?? "",
      placa,
      contrato,
      status,
      nf: r.nf_mc ?? "",
      valor: Number(r.valor) || 0,
      parecer,
      observacoes: r.observacoes ?? "",
      categoria: parecer,
      diasAtraso: diasAtraso(r.data_envio),
    } as unknown as Avaria;
  });

  const semNF = all.filter((r) => !r.nf_mc || String(r.nf_mc).trim() === "").length;
  const semParecer = all.filter(
    (r) =>
      !r.parecer_original ||
      (r.parecer_normalizado && r.parecer_normalizado === "Sem Parecer")
  ).length;

  return { importacao: imp as any, rows: mapped, semNF, semParecer };
}

export function useAvariasData(): AvariasDataState {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<AvariasQueryResult, Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchLatestAvarias,
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("avarias-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avarias_registros" },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avarias_importacoes" },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const importacao = data?.importacao ?? null;

  return {
    loading: isLoading,
    hasReal: !!importacao,
    importacao,
    rows: data?.rows ?? [],
    semNF: data?.semNF ?? 0,
    semParecer: data?.semParecer ?? 0,
    error: error ?? null,
    refresh: () => {
      refetch();
    },
  };
}
