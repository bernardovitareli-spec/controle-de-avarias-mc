import { describe, it, expect } from "vitest";
import { normalizeStatus, normalizeParecer } from "../normalize";

describe("normalizeStatus", () => {
  it("retorna Sem Status para vazio/nulo", () => {
    expect(normalizeStatus(null)).toBe("Sem Status");
    expect(normalizeStatus(undefined)).toBe("Sem Status");
  });
  it("mapeia variações conhecidas", () => {
    expect(normalizeStatus("reposição")).toBe("Reposição");
    expect(normalizeStatus("REPOSICAO")).toBe("Reposição");
    expect(normalizeStatus("Concluido")).toBe("Concluído");
    expect(normalizeStatus("A NEGOCIAR")).toBe("Em Negociação");
    expect(normalizeStatus("FECHADO NEGOCIADO")).toBe("Em Negociação");
    expect(normalizeStatus("Fechado")).toBe("Fechado");
  });
  it("preserva valores desconhecidos", () => {
    expect(normalizeStatus("Pendente")).toBe("Pendente");
  });
});

describe("normalizeParecer", () => {
  it("retorna Sem Parecer para vazio", () => {
    expect(normalizeParecer(null)).toBe("Sem Parecer");
  });
  it("mapeia variações", () => {
    expect(normalizeParecer("reposição")).toBe("Reposição");
    expect(normalizeParecer("CONCLUIDO")).toBe("Concluído");
    expect(normalizeParecer("a negociar")).toBe("À Negociar");
    expect(normalizeParecer("FECHADO NEGOCIADO")).toBe("À Negociar");
    expect(normalizeParecer("Fechado")).toBe("Fechado");
    expect(normalizeParecer("a enviar")).toBe("À Enviar");
  });
});
