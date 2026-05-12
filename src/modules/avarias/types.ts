export interface AvariaRegistro {
  id: string;
  importacao_id: string;
  data_envio: string | null;
  placa: string | null;
  contrato: string | null;
  status_original: string | null;
  status_normalizado: string | null;
  nf_mc: string | null;
  valor: number;
  parecer_original: string | null;
  parecer_normalizado: string | null;
  observacoes: string | null;
  categoria: string | null;
  subcategoria: string | null;
  chave_duplicidade: string | null;
  created_at: string;
}

export interface AvariaImportacao {
  id: string;
  nome_arquivo: string;
  data_importacao: string;
  total_linhas_lidas: number;
  total_registros_validos: number;
  total_registros_ignorados: number;
  total_duplicados: number;
  valor_total_importado: number;
  status_importacao: string;
  observacoes: string | null;
}

export interface ParsedRow {
  data_envio: string | null;   // ISO yyyy-mm-dd
  placa: string;
  contrato: string;
  status_original: string | null;
  nf_mc: string | null;
  valor: number;
  parecer_original: string | null;
  observacoes: string | null;
  _aba: string;
  _linha: number;
}

export interface SheetParseResult {
  abaName: string;
  contratoDetectado: string | null;
  rows: ParsedRow[];
  ignoradas: number;
  totalLinhas: number;
}
