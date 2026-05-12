import type { ParsedRow } from "./types";

export function buildDuplicateKey(r: {
  data_envio: string | null;
  placa: string | null;
  contrato: string | null;
  valor: number;
  nf_mc: string | null;
  observacoes: string | null;
}): string {
  const norm = (v?: string | null) =>
    (v ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  return [
    r.data_envio ?? "",
    norm(r.placa),
    norm(r.contrato),
    r.valor.toFixed(2),
    norm(r.nf_mc),
    norm(r.observacoes).slice(0, 80),
  ].join("|");
}

export const buildDuplicateKeyFromRow = (r: ParsedRow) => buildDuplicateKey(r);
