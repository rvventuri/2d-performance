import { describe, it, expect } from "vitest";
import { analyzeAssessment, calcEvolution } from "./analysis";
import type { Assessment } from "./types";

const baseMetrics = {
  cmj: null as number | null,
  sj: null as number | null,
  abalakov: null as number | null,
  rsi: null as number | null,
  tempoContato: null as number | null,
  alturaSaltoDJ: null as number | null,
  cmjEsquerdo: null as number | null,
  cmjDireito: null as number | null,
  assimetriaPercentual: null as number | null,
  saltoHorizontal: null as number | null,
};

function assess(partial: Partial<typeof baseMetrics>, id = "a"): Assessment {
  return {
    id,
    studentId: "s",
    date: "2025-01-01",
    metrics: { ...baseMetrics, ...partial },
  };
}

describe("analyzeAssessment", () => {
  it("assimetria > 15", () => {
    const i = analyzeAssessment(assess({ assimetriaPercentual: 20 }));
    expect(i.some((x) => x.title.includes("Alto Risco"))).toBe(true);
  });

  it("assimetria > 10", () => {
    const i = analyzeAssessment(assess({ assimetriaPercentual: 12 }));
    expect(i.some((x) => x.title.includes("Alerta"))).toBe(true);
  });

  it("assimetria ok", () => {
    const i = analyzeAssessment(assess({ assimetriaPercentual: 5 }));
    expect(i.some((x) => x.title.includes("Simetria"))).toBe(true);
  });

  it("ciclo elástico positivo", () => {
    const i = analyzeAssessment(assess({ cmj: 45, sj: 40 }));
    expect(i.some((x) => x.title.includes("Positivo"))).toBe(true);
  });

  it("ciclo elástico déficit", () => {
    const i = analyzeAssessment(assess({ cmj: 38, sj: 42 }));
    expect(i.some((x) => x.title.includes("Déficit"))).toBe(true);
  });

  it("ciclo elástico neutro", () => {
    const i = analyzeAssessment(assess({ cmj: 40, sj: 40 }));
    expect(i.some((x) => x.title.includes("Neutro"))).toBe(true);
  });

  it("RSI elite", () => {
    const i = analyzeAssessment(assess({ rsi: 2.1 }));
    expect(i.some((x) => x.title.includes("Elite"))).toBe(true);
  });

  it("RSI avançado", () => {
    const i = analyzeAssessment(assess({ rsi: 1.6 }));
    expect(i.some((x) => x.title.includes("Avançado"))).toBe(true);
  });

  it("RSI moderado", () => {
    const i = analyzeAssessment(assess({ rsi: 1.1 }));
    expect(i.some((x) => x.title.includes("Moderada"))).toBe(true);
  });

  it("RSI baixo", () => {
    const i = analyzeAssessment(assess({ rsi: 0.5 }));
    expect(i.some((x) => x.title.includes("Baixa"))).toBe(true);
  });

  it("tempo contato excelente com RSI", () => {
    const i = analyzeAssessment(assess({ tempoContato: 180, rsi: 1.2 }));
    expect(i.some((x) => x.title.includes("Excelente"))).toBe(true);
  });

  it("tempo contato elevado com RSI", () => {
    const i = analyzeAssessment(assess({ tempoContato: 320, rsi: 1.2 }));
    expect(i.some((x) => x.title.includes("Elevado"))).toBe(true);
  });

  it("evolução CMJ positiva com previous", () => {
    const cur = assess({ cmj: 45 }, "2");
    const prev = assess({ cmj: 40 }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("Evolução no CMJ"))).toBe(true);
  });

  it("queda CMJ com previous", () => {
    const cur = assess({ cmj: 35 }, "2");
    const prev = assess({ cmj: 40 }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("Queda"))).toBe(true);
  });

  it("ciclo elástico neutro quando bônus entre -2 e 0", () => {
    const i = analyzeAssessment(assess({ cmj: 39, sj: 40 }));
    expect(i.some((x) => x.title.includes("Neutro"))).toBe(true);
  });

  it("ciclo elástico déficit quando bônus < -2", () => {
    const i = analyzeAssessment(assess({ cmj: 35, sj: 40 }));
    expect(i.some((x) => x.title.includes("Déficit"))).toBe(true);
  });

  it("ciclo elástico com SJ zero usa elasticPct 0", () => {
    const i = analyzeAssessment(assess({ cmj: 10, sj: 0 }));
    expect(i.some((x) => x.title.includes("Positivo"))).toBe(true);
  });

  it("tempo de contato entre 200 e 300 não gera insight de contato", () => {
    const i = analyzeAssessment(assess({ tempoContato: 250, rsi: 1.2 }));
    expect(i.some((x) => x.title.includes("Tempo de Contato"))).toBe(false);
  });

  it("evolução CMJ sem insight quando diff entre -1 e 0", () => {
    const cur = assess({ cmj: 40 }, "2");
    const prev = assess({ cmj: 40 }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("Evolução no CMJ"))).toBe(false);
    expect(i.some((x) => x.title.includes("Queda"))).toBe(false);
  });

  it("evolução CMJ sem insight quando queda leve (diff > -1)", () => {
    const cur = assess({ cmj: 39.5 }, "2");
    const prev = assess({ cmj: 40 }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("Queda"))).toBe(false);
  });

  it("evolução CMJ ignorada quando métrica atual é null", () => {
    const cur = assess({ cmj: null }, "2");
    const prev = assess({ cmj: 40 }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("CMJ"))).toBe(false);
  });

  it("evolução CMJ ignorada quando métrica anterior é null", () => {
    const cur = assess({ cmj: 40 }, "2");
    const prev = assess({ cmj: null }, "1");
    const i = analyzeAssessment(cur, prev);
    expect(i.some((x) => x.title.includes("Evolução"))).toBe(false);
  });
});

describe("calcEvolution", () => {
  it("calcula mudanças", () => {
    const cur = assess({ cmj: 45, sj: 40 });
    const prev = assess({ cmj: 40, sj: 38 });
    const ev = calcEvolution(cur, prev);
    const cmj = ev.find((e) => e.key === "cmj");
    expect(cmj?.change).toBe(5);
    expect(cmj?.changePercent).toBeCloseTo(12.5, 1);
  });

  it("sem previous", () => {
    const ev = calcEvolution(assess({ cmj: 40 }));
    expect(ev.every((e) => e.previous === null)).toBe(true);
  });

  it("changePercent null quando previous é zero", () => {
    const cur = assess({ cmj: 10 });
    const prev = assess({ cmj: 0 });
    const ev = calcEvolution(cur, prev);
    const cmj = ev.find((e) => e.key === "cmj");
    expect(cmj?.change).toBe(10);
    expect(cmj?.changePercent).toBeNull();
  });
});
