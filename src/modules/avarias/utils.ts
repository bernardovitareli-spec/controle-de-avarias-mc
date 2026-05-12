export const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDateBR = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function diasAtraso(dataEnvio: string | null | undefined, ref = new Date()): number {
  if (!dataEnvio) return 0;
  const d = new Date(dataEnvio + "T00:00:00");
  const ms = ref.getTime() - d.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export type Criticidade = "Baixa" | "Média" | "Alta" | "Crítica";

export function criticidade(dias: number): Criticidade {
  if (dias > 180) return "Crítica";
  if (dias > 90) return "Alta";
  if (dias > 30) return "Média";
  return "Baixa";
}

export function faixaAtraso(dias: number): string {
  if (dias <= 30) return "0-30 dias";
  if (dias <= 60) return "31-60 dias";
  if (dias <= 90) return "61-90 dias";
  if (dias <= 180) return "91-180 dias";
  return "Acima de 180 dias";
}
