// Classificação automática da avaria a partir do texto de OBSERVAÇÕES
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

type Rule = { categoria: string; keywords: string[] };

const RULES: Rule[] = [
  { categoria: "Pneus e Rodagem", keywords: ["PNEU", "RODA", "RODAGEM", "CAMARA"] },
  { categoria: "Combustível, Arla e Lavagem", keywords: ["COMBUSTIVEL", "DIESEL", "ARLA", "LAVADOR", "LAVAGEM"] },
  { categoria: "Lataria, Estrutura e Carroceria", keywords: ["PARACHOQUE", "PARA-CHOQUE", "PARA CHOQUE", "LAMINA", "ESTRIBO", "LAMEIRA", "TANQUE", "TAMPA", "SUPORTE", "TIRANTE", "ABRACADEIRA", "PLATAFORMA", "PROTECAO"] },
  { categoria: "Elétrica e Iluminação", keywords: ["FAROL", "LANTERNA", "SENSOR", "INTERRUPTOR", "CHICOTE", "ELETRICA"] },
  { categoria: "Vidros, Espelhos e Retrovisores", keywords: ["VIDRO", "PARABRISA", "PARA-BRISA", "PARA BRISA", "ESPELHO", "RETROVISOR", "CRISTAL"] },
  { categoria: "Suspensão, Molas e Mecânica", keywords: ["MOLA", "BATENTE", "PINO", "BUCHA", "BRACO", "CAVALETE", "AMORTECEDOR", "PUNHO"] },
  { categoria: "Serviços de Recuperação e Manutenção", keywords: ["SERVICO", "RECUPERACAO", "MANUTENCAO", "MECANICA"] },
];

export function classifyAvaria(observacoes?: string | null): string {
  if (!observacoes) return "Outros";
  const text = norm(observacoes);
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.categoria;
  }
  return "Outros";
}

export const CATEGORIAS = [
  "Pneus e Rodagem",
  "Combustível, Arla e Lavagem",
  "Lataria, Estrutura e Carroceria",
  "Elétrica e Iluminação",
  "Vidros, Espelhos e Retrovisores",
  "Suspensão, Molas e Mecânica",
  "Serviços de Recuperação e Manutenção",
  "Outros",
];
