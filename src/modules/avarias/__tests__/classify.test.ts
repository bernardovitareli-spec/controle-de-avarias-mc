import { describe, it, expect } from "vitest";
import { classifyAvaria } from "../classify";

describe("classifyAvaria", () => {
  it("retorna Outros para nulo/vazio", () => {
    expect(classifyAvaria(null)).toBe("Outros");
    expect(classifyAvaria("")).toBe("Outros");
  });
  it("classifica por palavra-chave", () => {
    expect(classifyAvaria("Troca de pneu dianteiro")).toBe("Pneus e Rodagem");
    expect(classifyAvaria("Abastecimento de ARLA")).toBe("Combustível, Arla e Lavagem");
    expect(classifyAvaria("Reparo no para-choque")).toBe("Lataria, Estrutura e Carroceria");
    expect(classifyAvaria("Substituição de farol")).toBe("Elétrica e Iluminação");
    expect(classifyAvaria("Troca de retrovisor")).toBe("Vidros, Espelhos e Retrovisores");
    expect(classifyAvaria("Mola quebrada")).toBe("Suspensão, Molas e Mecânica");
    expect(classifyAvaria("Serviço de recuperação")).toBe("Serviços de Recuperação e Manutenção");
  });
  it("é case e acento insensível", () => {
    expect(classifyAvaria("PARABRISA TRINCADO")).toBe("Vidros, Espelhos e Retrovisores");
  });
  it("retorna Outros quando não há match", () => {
    expect(classifyAvaria("Algo totalmente diferente xyz")).toBe("Outros");
  });
});
