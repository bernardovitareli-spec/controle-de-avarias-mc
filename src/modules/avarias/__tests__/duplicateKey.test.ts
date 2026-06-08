import { describe, it, expect } from "vitest";
import { buildDuplicateKey } from "../duplicateKey";

const base = {
  data_envio: "2026-01-15",
  placa: "abc1d23",
  contrato: "001",
  valor: 1234.5,
  nf_mc: "nf-1",
  observacoes: "Troca de Pneu",
};

describe("buildDuplicateKey", () => {
  it("normaliza caixa e espaços", () => {
    const a = buildDuplicateKey(base);
    const b = buildDuplicateKey({ ...base, placa: "  ABC1D23  ", observacoes: "troca   de   pneu" });
    expect(a).toBe(b);
  });
  it("formata valor com 2 casas", () => {
    const k = buildDuplicateKey(base);
    expect(k).toContain("|1234.50|");
  });
  it("difere quando campos relevantes mudam", () => {
    expect(buildDuplicateKey(base)).not.toBe(buildDuplicateKey({ ...base, placa: "xyz9999" }));
    expect(buildDuplicateKey(base)).not.toBe(buildDuplicateKey({ ...base, valor: 1234.51 }));
  });
  it("trata nulos", () => {
    const k = buildDuplicateKey({ ...base, nf_mc: null, observacoes: null, placa: null, contrato: null, data_envio: null });
    expect(typeof k).toBe("string");
    expect(k.split("|").length).toBe(6);
  });
  it("trunca observacoes em 80 chars", () => {
    const obs = "A".repeat(200);
    const k = buildDuplicateKey({ ...base, observacoes: obs });
    const last = k.split("|").pop()!;
    expect(last.length).toBe(80);
  });
});
