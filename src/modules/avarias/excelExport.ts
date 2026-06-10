import * as XLSX from "xlsx";
import type { Avaria } from "@/data/avarias";
import { criticidade as critOf, formatDateBR } from "./utils";

export function exportAvariasExcel(data: Avaria[]) {
  const rows = data.map((a) => ({
    "Data": formatDateBR(a.dataEnvio),
    "Placa": a.placa,
    "Contrato": a.contrato,
    "Categoria": a.categoria,
    "Parecer": a.parecer || "",
    "NF": a.nf || "",
    "Valor": a.valor,
    "Dias de atraso": a.diasAtraso,
    "Criticidade": critOf(a.diasAtraso),
    "Observações": a.observacoes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // currency format for Valor column (G)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 6 })];
    if (cell) cell.z = '"R$" #,##0.00';
  }
  ws["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
    { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
    { wch: 12 }, { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Avarias");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Avarias_MC_${date}.xlsx`);
}
