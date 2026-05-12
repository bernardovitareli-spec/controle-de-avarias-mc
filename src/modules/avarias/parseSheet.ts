import * as XLSX from "xlsx";
import type { ParsedRow, SheetParseResult } from "./types";

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

// Mapeamento de variações de cabeçalho -> chave canônica
const HEADER_MAP: Record<string, string> = {
  DIA: "data_envio",
  DATA: "data_envio",
  "DATA ENVIO": "data_envio",
  "DATA DE ENVIO": "data_envio",
  PLACA: "placa",
  CONTRATO: "contrato",
  STATUS: "status_original",
  "NF MC": "nf_mc",
  NF: "nf_mc",
  "NOTA FISCAL": "nf_mc",
  VALOR: "valor",
  "VALOR R$": "valor",
  "PARECER CLIENTE": "parecer_original",
  PARECER: "parecer_original",
  OBSERVACOES: "observacoes",
  OBSERVACAO: "observacoes",
  OBS: "observacoes",
};

function mapHeader(h: any): string | null {
  if (h === null || h === undefined) return null;
  const key = stripAccents(String(h)).replace(/\s+/g, " ");
  return HEADER_MAP[key] ?? null;
}

function excelDateToISO(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  // Excel serial number
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const mm = String(d.m).padStart(2, "0");
    const dd = String(d.d).padStart(2, "0");
    return `${d.y}-${mm}-${dd}`;
  }
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  // dd/mm/yyyy
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = (parseInt(yy) > 50 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return null;
}

function parseValor(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim().replace(/[R$\s]/g, "");
  if (!s) return 0;
  // Remove milhares e troca decimal
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function cleanText(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s+/g, " ");
  return s || null;
}

const REQUIRED = ["data_envio", "placa", "contrato", "valor"];

export interface SheetParseFull extends SheetParseResult {
  missingRequired: string[];
  headersFound: string[];
}

function detectContrato(abaName: string): string | null {
  const m = abaName.match(/(\d{3,})/);
  return m ? m[1] : null;
}

export function parseSheet(ws: XLSX.WorkSheet, abaName: string): SheetParseFull {
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  if (!aoa.length) {
    return { abaName, contratoDetectado: detectContrato(abaName), rows: [], ignoradas: 0, totalLinhas: 0, missingRequired: REQUIRED, headersFound: [] };
  }

  // Encontrar linha de cabeçalho: primeira linha com pelo menos 3 mapeáveis
  let headerRowIdx = -1;
  let headerMap: (string | null)[] = [];
  for (let i = 0; i < Math.min(aoa.length, 15); i++) {
    const mapped = aoa[i].map(mapHeader);
    if (mapped.filter(Boolean).length >= 3) {
      headerRowIdx = i;
      headerMap = mapped;
      break;
    }
  }
  if (headerRowIdx === -1) {
    return { abaName, contratoDetectado: detectContrato(abaName), rows: [], ignoradas: aoa.length, totalLinhas: aoa.length, missingRequired: REQUIRED, headersFound: [] };
  }

  const headersFound = headerMap.filter(Boolean) as string[];
  const missingRequired = REQUIRED.filter((r) => !headersFound.includes(r));
  const contratoDetectado = detectContrato(abaName);

  const rows: ParsedRow[] = [];
  let ignoradas = 0;
  const dataRows = aoa.slice(headerRowIdx + 1);

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    if (!r || r.every((c) => c === null || c === undefined || String(c).trim() === "")) {
      ignoradas++;
      continue;
    }
    const obj: any = {};
    headerMap.forEach((key, idx) => {
      if (key) obj[key] = r[idx];
    });

    const data_envio = excelDateToISO(obj.data_envio);
    const placa = cleanText(obj.placa);
    const contratoCell = cleanText(obj.contrato);
    const contrato = contratoCell || contratoDetectado;
    const valor = parseValor(obj.valor);
    const observacoes = cleanText(obj.observacoes);

    // Linha totalizadora: sem data/placa/contrato mas com valor
    if (!data_envio && !placa && !contrato) {
      ignoradas++;
      continue;
    }
    // Sem dados mínimos relevantes
    if (!data_envio && !placa && !contrato && valor === 0) {
      ignoradas++;
      continue;
    }
    // Texto que parece "TOTAL" em obs/placa
    const looksTotal = (placa && /^TOTAL/i.test(placa)) || (observacoes && /^TOTAL/i.test(observacoes));
    if (looksTotal && !data_envio) {
      ignoradas++;
      continue;
    }

    rows.push({
      data_envio,
      placa: placa ?? "",
      contrato: contrato ?? "",
      status_original: cleanText(obj.status_original),
      nf_mc: cleanText(obj.nf_mc),
      valor,
      parecer_original: cleanText(obj.parecer_original),
      observacoes,
      _aba: abaName,
      _linha: headerRowIdx + 2 + i,
    });
  }

  return {
    abaName,
    contratoDetectado,
    rows,
    ignoradas,
    totalLinhas: dataRows.length,
    missingRequired,
    headersFound,
  };
}

export async function parseWorkbook(file: File): Promise<{
  sheets: SheetParseFull[];
  allRows: ParsedRow[];
}> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  const sheets: SheetParseFull[] = [];
  const allRows: ParsedRow[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const res = parseSheet(ws, name);
    sheets.push(res);
    allRows.push(...res.rows);
  }
  return { sheets, allRows };
}
