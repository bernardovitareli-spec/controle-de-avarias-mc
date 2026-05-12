// Normalização de status e parecer cliente
const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

export function normalizeStatus(raw?: string | null): string {
  if (!raw) return "Sem Status";
  const s = stripAccents(raw);
  if (s.includes("REPOSI")) return "Reposição";
  if (s.includes("CONCLU")) return "Concluído";
  if (s.includes("FECHADO") && s.includes("NEGOC")) return "Em Negociação";
  if (s.includes("NEGOC") || s === "A NEGOCIAR") return "Em Negociação";
  if (s.includes("FECHADO")) return "Fechado";
  return raw.trim() || "Sem Status";
}

export function normalizeParecer(raw?: string | null): string {
  if (!raw) return "Sem Parecer";
  const s = stripAccents(raw);
  if (s.includes("REPOSI")) return "Reposição";
  if (s.includes("CONCLU")) return "Concluído";
  if (s.includes("FECHADO") && s.includes("NEGOC")) return "À Negociar";
  if (s.includes("NEGOC")) return "À Negociar";
  if (s.includes("FECHADO")) return "Fechado";
  if (s.includes("ENVIAR")) return "À Enviar";
  return raw.trim() || "Sem Parecer";
}
