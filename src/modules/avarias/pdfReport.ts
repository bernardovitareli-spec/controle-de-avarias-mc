import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Avaria } from "@/data/avarias";
import { criticidade as critOf, formatCurrency, faixaAtraso } from "./utils";

export interface PdfFilters {
  contratos: string[];
  pareceres: string[];
  placas: string[];
  criticidades: string[];
  nf: string[];
}

export interface PdfOptions {
  resumoExecutivo: boolean;
  graficos: boolean;
  tabelaDetalhada: boolean;
  analiseContrato: boolean;
  analiseCategoria: boolean;
  rankingPlacas: boolean;
  semNF: boolean;
  semParecer: boolean;
  observacoes: string;
}

export interface PdfMeta {
  importacaoNome?: string | null;
  importacaoData?: string | null;
  totalImportacao?: number;
}

const fmtDateBR = (iso?: string | null) => {
  if (!iso) return "—";
  if (iso.includes("T")) return new Date(iso).toLocaleString("pt-BR");
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const sanitizeFile = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_");

export function buildFileName(filters: PdfFilters): string {
  const date = new Date().toISOString().slice(0, 10);
  if (filters.contratos.length === 1) {
    return `Relatorio_Avarias_MC_${sanitizeFile(filters.contratos[0])}_${date}.pdf`;
  }
  return `Relatorio_Avarias_MC_${date}.pdf`;
}

export function generatePdfReport(
  data: Avaria[],
  filters: PdfFilters,
  options: PdfOptions,
  meta: PdfMeta,
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const emissao = new Date();

  // ---- Helpers
  let y = margin;
  const ensure = (h: number) => {
    if (y + h > pageH - 50) {
      doc.addPage();
      y = margin;
    }
  };
  const h1 = (t: string) => {
    ensure(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text(t, margin, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  };
  const p = (t: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(t, pageW - margin * 2);
    ensure(lines.length * (size + 2));
    doc.text(lines, margin, y);
    y += lines.length * (size + 2) + 4;
  };

  // ---- Cabeçalho / Capa
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório Executivo de Avarias - MC Terraplenagem", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Análise de avarias por contrato e equipamento", margin, 50);
  doc.text(`Emitido em: ${emissao.toLocaleString("pt-BR")}`, pageW - margin, 50, { align: "right" });
  y = 90;

  // ---- Filtros
  h1("Filtros Aplicados");
  const fLine = (label: string, vals: string[]) =>
    p(`${label}: ${vals.length ? vals.join(", ") : "Todos"}`);
  const semFiltros =
    !filters.contratos.length &&
    !filters.pareceres.length &&
    !filters.placas.length &&
    !filters.criticidades.length &&
    !filters.nf.length;
  if (semFiltros) {
    p("Base completa da última importação.");
  } else {
    fLine("Contratos", filters.contratos);
    fLine("Parecer", filters.pareceres);
    fLine("Placas", filters.placas);
    fLine("Criticidade", filters.criticidades);
    fLine("NF", filters.nf);
  }
  if (meta.importacaoNome) {
    p(`Arquivo de origem: ${meta.importacaoNome}`);
    p(`Última importação: ${fmtDateBR(meta.importacaoData)}`);
  }

  // ---- Indicadores
  const totalValor = data.reduce((s, a) => s + a.valor, 0);
  const totalQtd = data.length;
  const contratos = [...new Set(data.map((a) => a.contrato))];
  const placas = [...new Set(data.map((a) => a.placa))];
  const avgAtraso = Math.round(data.reduce((s, a) => s + a.diasAtraso, 0) / (totalQtd || 1));
  const maxAtraso = Math.max(0, ...data.map((a) => a.diasAtraso));
  const criticas = data.filter((a) => a.diasAtraso > 180).length;
  const semNF = data.filter((a) => !a.nf || !String(a.nf).trim()).length;
  const valorSemNF = data.filter((a) => !a.nf || !String(a.nf).trim()).reduce((s, a) => s + a.valor, 0);
  const semParecer = data.filter((a) => !a.parecer || a.parecer === "Sem Parecer").length;
  const valorNegociacao = data.filter((a) => /negoc/i.test(a.parecer)).reduce((s, a) => s + a.valor, 0);
  const valorReposicao = data.filter((a) => /reposi/i.test(a.parecer)).reduce((s, a) => s + a.valor, 0);
  const valorSemParecer = data.filter((a) => !a.parecer || a.parecer === "Sem Parecer").reduce((s, a) => s + a.valor, 0);

  if (options.resumoExecutivo) {
    h1("Resumo Executivo");
    p(
      `Este relatório consolida as avarias registradas para os filtros selecionados, totalizando ${totalQtd} ocorrências e valor acumulado de ${formatCurrency(totalValor)}. As informações foram geradas com base na última importação validada no sistema, considerando contratos, equipamentos, pareceres, categorias e criticidade das avarias.`,
    );

    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Indicador", "Valor"]],
      body: [
        ["Valor Total", formatCurrency(totalValor)],
        ["Total de Avarias", String(totalQtd)],
        ["Contratos Envolvidos", String(contratos.length)],
        ["Equipamentos / Placas", String(placas.length)],
        ["Atraso Médio", `${avgAtraso} dias`],
        ["Maior Atraso", `${maxAtraso} dias`],
        ["Avarias Críticas (>180d)", String(criticas)],
        ["Valor em Negociação", formatCurrency(valorNegociacao)],
        ["Valor em Reposição", formatCurrency(valorReposicao)],
        ["Valor Sem Parecer", formatCurrency(valorSemParecer)],
        ["Registros Sem NF", String(semNF)],
        ["Valor Sem NF", formatCurrency(valorSemNF)],
      ],
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---- Análise por Contrato
  if (options.analiseContrato && contratos.length) {
    h1("Análise por Contrato");
    const rows = contratos
      .map((c) => {
        const items = data.filter((a) => a.contrato === c);
        const v = items.reduce((s, a) => s + a.valor, 0);
        const am = Math.round(items.reduce((s, a) => s + a.diasAtraso, 0) / (items.length || 1));
        const mx = Math.max(0, ...items.map((a) => a.diasAtraso));
        const cr = items.filter((a) => a.diasAtraso > 180).length;
        const sn = items.filter((a) => !a.nf || !String(a.nf).trim()).length;
        const sp = items.filter((a) => !a.parecer || a.parecer === "Sem Parecer").length;
        return [c, items.length, formatCurrency(v), `${am}d`, `${mx}d`, cr, sn, sp];
      })
      .sort((a: any, b: any) => b[1] - a[1]);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Contrato", "Qtd", "Valor", "Atraso Méd.", "Maior Atraso", "Críticas", "Sem NF", "Sem Parecer"]],
      body: rows as any,
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---- Distribuição por Parecer
  if (options.analiseCategoria) {
    h1("Distribuição por Parecer do Cliente");
    const pareceres = [...new Set(data.map((a) => a.parecer || "Sem Parecer"))];
    const rows = pareceres
      .map((p) => {
        const items = data.filter((a) => (a.parecer || "Sem Parecer") === p);
        const v = items.reduce((s, a) => s + a.valor, 0);
        const pct = totalValor > 0 ? ((v / totalValor) * 100).toFixed(1) + "%" : "0%";
        return [p, items.length, formatCurrency(v), pct];
      })
      .sort((a: any, b: any) => b[1] - a[1]);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Parecer", "Qtd", "Valor", "% do Total"]],
      body: rows as any,
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    h1("Análise por Criticidade");
    const crits = ["Baixa", "Média", "Alta", "Crítica"];
    const crRows = crits.map((c) => {
      const items = data.filter((a) => critOf(a.diasAtraso) === c);
      const v = items.reduce((s, a) => s + a.valor, 0);
      const pct = totalValor > 0 ? ((v / totalValor) * 100).toFixed(1) + "%" : "0%";
      return [c, items.length, formatCurrency(v), pct];
    });
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Criticidade", "Qtd", "Valor", "% do Total"]],
      body: crRows as any,
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---- Ranking de Placas
  if (options.rankingPlacas && placas.length) {
    h1("Ranking de Equipamentos / Placas");
    const rows = placas
      .map((pl) => {
        const items = data.filter((a) => a.placa === pl);
        const v = items.reduce((s, a) => s + a.valor, 0);
        const mx = Math.max(0, ...items.map((a) => a.diasAtraso));
        const cont = items[0]?.contrato || "—";
        const parecerCount: Record<string, number> = {};
        items.forEach((a) => {
          const k = a.parecer || "Sem Parecer";
          parecerCount[k] = (parecerCount[k] || 0) + 1;
        });
        const parecerPred = Object.entries(parecerCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
        return [pl, cont, items.length, formatCurrency(v), `${mx}d`, parecerPred];
      })
      .sort((a: any, b: any) => parseFloat(String(b[3]).replace(/[^\d,-]/g, "").replace(",", ".")) - parseFloat(String(a[3]).replace(/[^\d,-]/g, "").replace(",", ".")))
      .slice(0, 30);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Placa", "Contrato", "Qtd", "Valor", "Maior Atraso", "Parecer Pred."]],
      body: rows as any,
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---- Sem NF
  if (options.semNF) {
    const semNFRows = data.filter((a) => !a.nf || !String(a.nf).trim());
    if (semNFRows.length) {
      h1(`Registros sem NF (${semNFRows.length})`);
      autoTable(doc, {
        startY: y,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [180, 60, 60], textColor: 255 },
        head: [["Data", "Placa", "Contrato", "Valor", "Parecer"]],
        body: semNFRows.slice(0, 100).map((a) => [fmtDateBR(a.dataEnvio), a.placa, a.contrato, formatCurrency(a.valor), a.parecer]),
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 16;
    }
  }

  // ---- Sem Parecer
  if (options.semParecer) {
    const semPRows = data.filter((a) => !a.parecer || a.parecer === "Sem Parecer");
    if (semPRows.length) {
      h1(`Registros sem Parecer (${semPRows.length})`);
      autoTable(doc, {
        startY: y,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [180, 60, 60], textColor: 255 },
        head: [["Data", "Placa", "Contrato", "Valor", "NF"]],
        body: semPRows.slice(0, 100).map((a) => [fmtDateBR(a.dataEnvio), a.placa, a.contrato, formatCurrency(a.valor), a.nf || "—"]),
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 16;
    }
  }

  // ---- Tabela Detalhada
  if (options.tabelaDetalhada) {
    doc.addPage();
    y = margin;
    h1("Detalhamento das Avarias");
    const sorted = [...data].sort((a, b) => b.valor - a.valor);
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7 },
      head: [["Data", "Placa", "Contrato", "Categoria", "Parecer", "NF", "Valor", "Dias", "Crit.", "Obs."]],
      body: sorted.map((a) => [
        fmtDateBR(a.dataEnvio),
        a.placa,
        a.contrato,
        a.categoria,
        a.parecer,
        a.nf || "—",
        formatCurrency(a.valor),
        String(a.diasAtraso),
        critOf(a.diasAtraso),
        a.observacoes || "",
      ]),
      foot: [["", "", "", "", "", "TOTAL", formatCurrency(totalValor), "", "", `${totalQtd} reg.`]],
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60 },
        3: { cellWidth: 55 },
        4: { cellWidth: 55 },
        5: { cellWidth: 35 },
        6: { cellWidth: 55 },
        7: { cellWidth: 28 },
        8: { cellWidth: 38 },
        9: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---- Considerações
  ensure(80);
  h1("Considerações para Tratativa Comercial");
  p(
    "As avarias apresentadas neste relatório foram consolidadas a partir dos registros internos da MC Terraplenagem, conforme dados de controle importados no sistema. Os valores, equipamentos, contratos e observações listados têm como finalidade subsidiar a análise, negociação e eventual cobrança junto ao cliente, conforme responsabilidades contratuais e evidências operacionais disponíveis.",
  );
  if (options.observacoes && options.observacoes.trim()) {
    h1("Observações Adicionais");
    p(options.observacoes.trim());
  }

  // ---- Auditoria
  ensure(80);
  h1("Auditoria");
  p(`Fonte dos dados: última importação validada`);
  p(`Arquivo de origem: ${meta.importacaoNome || "—"}`);
  p(`Data/hora da importação: ${fmtDateBR(meta.importacaoData)}`);
  if (typeof meta.totalImportacao === "number") {
    p(`Total de registros da importação: ${meta.totalImportacao}`);
  }
  p(`Total de registros considerados no relatório: ${totalQtd}`);

  // ---- Rodapé com paginação
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setDrawColor(220);
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
    doc.text("MC Terraplenagem · Relatório Executivo de Avarias", margin, pageH - 18);
    doc.text(emissao.toLocaleString("pt-BR"), pageW / 2, pageH - 18, { align: "center" });
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 18, { align: "right" });
  }

  return doc;
}
