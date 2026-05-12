import { describe, it, expect } from "vitest";
import {
  buildAnalysisPrompt,
  parseAnalysisJson,
} from "./ai-analysis.service";
import type { Student, Assessment, ResolvedMetricConfig } from "@/lib/types";

const student: Student = {
  id: "s",
  name: "Atleta",
  age: 20,
  weight: 70,
  height: 175,
  objective: "Ganhar explosão",
  photoUrl: null,
  createdAt: "t",
};

const m = (key: string): ResolvedMetricConfig => ({
  key,
  label: key.toUpperCase(),
  unit: "cm",
  higherIsBetter: true,
  benchRecreational: 1,
  benchTrained: 2,
  benchElite: 3,
  isEnabled: true,
  weight: 1,
  isCustom: false,
  displayOrder: 0,
});

const assessment = (id: string, date: string, cmj: number): Assessment => ({
  id,
  studentId: "s",
  date,
  metrics: {
    cmj,
    sj: null,
    abalakov: null,
    rsi: null,
    tempoContato: null,
    alturaSaltoDJ: null,
    cmjEsquerdo: null,
    cmjDireito: null,
    assimetriaPercentual: null,
    saltoHorizontal: null,
  },
  customMetrics: { extra: 5 },
});

describe("parseAnalysisJson", () => {
  it("extrai JSON do meio do texto", () => {
    const raw = 'prefix {"performanceScore": 50} suffix';
    const data = parseAnalysisJson(raw);
    expect(data.performanceScore).toBe(50);
  });

  it("lança sem chaves", () => {
    expect(() => parseAnalysisJson("no json")).toThrow("JSON");
  });
});

describe("buildAnalysisPrompt", () => {
  it("inclui histórico com mais de duas avaliações", () => {
    const a = [
      assessment("1", "2024-01-01", 40),
      assessment("2", "2024-02-01", 42),
      assessment("3", "2024-03-01", 44),
    ];
    const metrics = [m("cmj"), m("extra")];
    const prompt = buildAnalysisPrompt(student, a, metrics, "ctx", []);
    expect(prompt).toContain("HISTÓRICO COMPLETO");
    expect(prompt).toContain("ctx");
  });

  it("sem objetivo usa texto padrão", () => {
    const s = { ...student, objective: "" };
    const prompt = buildAnalysisPrompt(s, [assessment("1", "2025-01-01", 40)], [m("cmj")], "", []);
    expect(prompt).toContain("Não informado");
  });

  it("sem trainerContext omite seção", () => {
    const prompt = buildAnalysisPrompt(student, [assessment("1", "2025-01-01", 40)], [m("cmj")], "", []);
    expect(prompt).not.toContain("## Contexto do preparador");
  });
});
