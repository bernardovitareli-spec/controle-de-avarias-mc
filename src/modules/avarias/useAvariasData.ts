import { useEffect, useState, useCallback } from "react";
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
  refresh: () => void;
}

export function useAvariasData(): AvariasDataState {
  const [loading, setLoading] = useState(true);
  const [importacao, setImportacao] = useState<AvariaImportacao | null>(null);
  const [rows, setRows] = useState<Avaria[]>([]);
  const [semNF, setSemNF] = useState(0);
  const [semParecer, setSemParecer] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: imps } = await supabase
        .from("avarias_importacoes")
        .select("*")
        .in("status_importacao", ["confirmada", "concluida"])
        .order("data_importacao", { ascending: false })
        .limit(1);

      const imp = imps?.[0] ?? null;
      if (!imp) {
        if (!cancelled) {
          setImportacao(null);
          setRows([]);
          setSemNF(0);
          setSemParecer(0);
          setLoading(false);
        }
        return;
      }

      // paginar para evitar limite de 1000
      const all: any[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("avarias_registros")
          .select("*")
          .eq("importacao_id", imp.id)
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
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
          // categoria exibida no dashboard segue o "parecer" (consistente com Index)
          categoria: parecer,
          diasAtraso: diasAtraso(r.data_envio),
        } as unknown as Avaria;
      });

      const sNF = all.filter((r) => !r.nf_mc || String(r.nf_mc).trim() === "").length;
      const sPar = all.filter(
        (r) =>
          !r.parecer_original ||
          (r.parecer_normalizado && r.parecer_normalizado === "Sem Parecer")
      ).length;

      if (!cancelled) {
        setImportacao(imp as any);
        setRows(mapped);
        setSemNF(sNF);
        setSemParecer(sPar);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Realtime: refetch ao mudar registros/importações
  useEffect(() => {
    const channel = supabase
      .channel("avarias-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avarias_registros" },
        () => setTick((t) => t + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avarias_importacoes" },
        () => setTick((t) => t + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    loading,
    hasReal: !!importacao,
    importacao,
    rows,
    semNF,
    semParecer,
    refresh,
  };
}
