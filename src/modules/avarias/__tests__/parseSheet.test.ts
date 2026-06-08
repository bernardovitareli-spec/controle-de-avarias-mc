import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseSheet } from "../parseSheet";

const makeSheet = (aoa: any[][]) => XLSX.utils.aoa_to_sheet(aoa);

describe("parseSheet", () => {
  it("parseia cabeçalhos canônicos e linhas válidas", () => {
    const ws = makeSheet([
      ["DATA", "PLACA", "CONTRATO", "STATUS", "NF MC", "VALOR", "PARECER CLIENTE", "OBSERVACOES"],
      ["15/01/2026", "ABC1D23", "001", "Reposição", "NF-1", "1.234,50", "Concluído", "Troca de pneu"],
      ["2026-01-16", "XYZ9999", "002", "Fechado", null, 500, "Fechado", "Reparo de farol"],
    ]);
    const r = parseSheet(ws, "Contrato 001");
    expect(r.missingRequired).toEqual([]);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].data_envio).toBe("2026-01-15");
    expect(r.rows[0].valor).toBeCloseTo(1234.5);
    expect(r.rows[1].data_envio).toBe("2026-01-16");
    expect(r.rows[1].valor).toBe(500);
    expect(r.contratoDetectado).toBe("001");
  });

  it("aceita variações de cabeçalho e acentos", () => {
    const ws = makeSheet([
      ["Dia", "Placa", "Contrato", "Valor R$", "Observação"],
      ["01/02/2026", "AAA1A11", "010", "100,00", "obs"],
    ]);
    const r = parseSheet(ws, "Aba X");
    expect(r.missingRequired).toEqual([]);
    expect(r.rows[0].observacoes).toBe("obs");
    expect(r.rows[0].valor).toBe(100);
  });

  it("ignora linhas em branco e totalizadoras", () => {
    const ws = makeSheet([
      ["DATA", "PLACA", "CONTRATO", "VALOR"],
      ["10/01/2026", "ABC1D23", "001", 100],
      [null, null, null, null],
      [null, "TOTAL", null, 100],
    ]);
    const r = parseSheet(ws, "001");
    expect(r.rows).toHaveLength(1);
    expect(r.ignoradas).toBeGreaterThanOrEqual(2);
  });

  it("usa contrato detectado da aba quando coluna vazia", () => {
    const ws = makeSheet([
      ["DATA", "PLACA", "CONTRATO", "VALOR"],
      ["10/01/2026", "ABC1D23", null, 100],
    ]);
    const r = parseSheet(ws, "Aba 12345");
    expect(r.rows[0].contrato).toBe("12345");
  });

  it("retorna missingRequired quando faltam colunas obrigatórias", () => {
    const ws = makeSheet([
      ["DATA", "PLACA", "STATUS", "OBSERVACOES"],
      ["10/01/2026", "ABC1D23", "x", "y"],
    ]);
    const r = parseSheet(ws, "Aba");
    expect(r.missingRequired).toContain("contrato");
    expect(r.missingRequired).toContain("valor");
  });

  it("retorna vazio para sheet sem cabeçalho reconhecível", () => {
    const ws = makeSheet([["foo", "bar"], ["a", "b"]]);
    const r = parseSheet(ws, "Aba");
    expect(r.rows).toHaveLength(0);
    expect(r.missingRequired.length).toBeGreaterThan(0);
  });
});
