import { describe, it, expect } from "vitest";
import {
  buildTrainerContext,
  buildBenchmarkSection,
  buildGoalsSection,
  buildWeightNote,
} from "./TrainerContextBuilder";
import { TrainerProfile, ResolvedMetricConfig, MetricConfig, StudentGoal } from "@/lib/types";
import { resolveMetricConfigs } from "./MetricConfigResolver";
import { DEFAULT_METRICS } from "./DefaultMetrics";

function makeProfile(partial: Partial<TrainerProfile> = {}): TrainerProfile {
  return {
    id: "id",
    userId: "user",
    coachingPhilosophy: "",
    sportContext: "",
    athleteProfiles: "",
    priorityFocus: "",
    customInstructions: "",
    updatedAt: "2025-01-01",
    ...partial,
  };
}

describe("buildTrainerContext", () => {
  it("retorna string vazia para null", () => {
    expect(buildTrainerContext(null)).toBe("");
  });

  it("retorna string vazia para perfil com campos vazios", () => {
    expect(buildTrainerContext(makeProfile())).toBe("");
  });

  it("inclui somente campos preenchidos", () => {
    const ctx = buildTrainerContext(
      makeProfile({ coachingPhilosophy: "Periodização ondulatória" })
    );
    expect(ctx).toContain("Periodização ondulatória");
    expect(ctx).toContain("FILOSOFIA DE TREINAMENTO");
    expect(ctx).not.toContain("CONTEXTO ESPORTIVO");
  });

  it("inclui todos os campos quando preenchidos", () => {
    const ctx = buildTrainerContext(
      makeProfile({
        coachingPhilosophy: "A",
        sportContext: "B",
        athleteProfiles: "C",
        priorityFocus: "D",
        customInstructions: "E",
      })
    );
    expect(ctx).toContain("FILOSOFIA");
    expect(ctx).toContain("CONTEXTO ESPORTIVO");
    expect(ctx).toContain("PERFIL TÍPICO");
    expect(ctx).toContain("FOCO PRIORITÁRIO");
    expect(ctx).toContain("INSTRUÇÕES PERSONALIZADAS");
  });

  it("ignora campos com apenas espaços em branco", () => {
    const ctx = buildTrainerContext(makeProfile({ coachingPhilosophy: "   " }));
    expect(ctx).toBe("");
  });
});

function defaultMetricConfigs(): MetricConfig[] {
  return DEFAULT_METRICS.map((def, i) => ({
    id: `id-${def.key}`,
    userId: "u",
    metricKey: def.key,
    label: def.label,
    unit: def.unit,
    higherIsBetter: def.higherIsBetter,
    isCustom: false,
    isEnabled: true,
    benchRecreational: def.benchRecreational,
    benchTrained: def.benchTrained,
    benchElite: def.benchElite,
    weight: 1,
    displayOrder: i,
    createdAt: "2025-01-01",
  }));
}

describe("buildBenchmarkSection", () => {
  it("gera uma linha por métrica habilitada", () => {
    const resolved = resolveMetricConfigs(defaultMetricConfigs());
    const section = buildBenchmarkSection(resolved);
    const lines = section.split("\n").filter(Boolean);
    expect(lines).toHaveLength(10);
  });

  it("omite métricas desabilitadas", () => {
    const resolved = resolveMetricConfigs([
      {
        id: "x",
        userId: "u",
        metricKey: "cmj",
        label: "CMJ",
        unit: "cm",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: false,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 1,
        displayOrder: 0,
        createdAt: "2025-01-01",
      },
    ]);
    const section = buildBenchmarkSection(resolved);
    expect(section).not.toContain("CMJ (cm, maior");
  });

  it("inclui nota de peso quando weight != 1", () => {
    const resolved = resolveMetricConfigs([
      {
        id: "x",
        userId: "u",
        metricKey: "rsi",
        label: "RSI",
        unit: "",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: true,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 2,
        displayOrder: 3,
        createdAt: "2025-01-01",
      },
    ]);
    const section = buildBenchmarkSection(resolved);
    expect(section).toContain("[peso: 2x]");
  });

  it("usa adimensional e MENOR = melhor quando aplicável", () => {
    const resolved = resolveMetricConfigs([
      {
        id: "x",
        userId: "u",
        metricKey: "tempoContato",
        label: "TC",
        unit: "",
        higherIsBetter: false,
        isCustom: false,
        isEnabled: true,
        benchRecreational: 300,
        benchTrained: 230,
        benchElite: 170,
        weight: 1,
        displayOrder: 0,
        createdAt: "2025-01-01",
      },
    ]);
    const section = buildBenchmarkSection(resolved);
    expect(section).toContain("adimensional");
    expect(section).toContain("MENOR = melhor");
  });
});

describe("buildWeightNote", () => {
  it("retorna string vazia quando todos os pesos são 1", () => {
    const resolved = resolveMetricConfigs([]);
    expect(buildWeightNote(resolved)).toBe("");
  });

  it("inclui lista de métricas com peso diferente de 1", () => {
    const resolved = resolveMetricConfigs([
      {
        id: "x",
        userId: "u",
        metricKey: "rsi",
        label: "RSI",
        unit: "",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: true,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 2,
        displayOrder: 3,
        createdAt: "2025-01-01",
      },
    ]);
    const note = buildWeightNote(resolved);
    expect(note).toContain("RSI");
    expect(note).toContain("2x");
    expect(note).toContain("PONDERAÇÃO");
  });

  it("omite métricas desabilitadas da nota de peso", () => {
    const resolved: ResolvedMetricConfig[] = [
      {
        key: "cmj",
        label: "CMJ",
        unit: "cm",
        higherIsBetter: true,
        benchRecreational: 30,
        benchTrained: 42,
        benchElite: 60,
        isEnabled: false,
        weight: 3,
        isCustom: false,
        displayOrder: 0,
      },
    ];
    expect(buildWeightNote(resolved)).toBe("");
  });
});

const baseResolved = (key: string, overrides: Partial<ResolvedMetricConfig> = {}): ResolvedMetricConfig => ({
  key,
  label: "CMJ",
  unit: "cm",
  higherIsBetter: true,
  benchRecreational: 30,
  benchTrained: 42,
  benchElite: 60,
  isEnabled: true,
  weight: 1,
  isCustom: false,
  displayOrder: 0,
  ...overrides,
});

describe("buildGoalsSection", () => {
  it("retorna vazio sem metas", () => {
    expect(buildGoalsSection([], {}, [])).toBe("");
  });

  it("lista metas com label da métrica resolvida", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "cmj",
        targetValue: 50,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, {}, [baseResolved("cmj")]);
    expect(section).toContain("METAS DEFINIDAS");
    expect(section).toContain("CMJ");
    expect(section).toContain("50");
  });

  it("usa metricKey quando métrica não está no mapa", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "unknown_key",
        targetValue: 10,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, {}, []);
    expect(section).toContain("unknown_key");
  });

  it("inclui prazo formatado quando targetDate definido", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "cmj",
        targetValue: 50,
        targetDate: "2026-06-15",
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, {}, [baseResolved("cmj")]);
    expect(section).toMatch(/prazo:/);
  });

  it("nota progresso quando há valor atual (higherIsBetter)", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "cmj",
        targetValue: 50,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, { cmj: 25 }, [baseResolved("cmj", { higherIsBetter: true })]);
    expect(section).toContain("atual:");
    expect(section).toContain("50% da meta");
  });

  it("nota progresso com higherIsBetter false", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "tempoContato",
        targetValue: 200,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const metrics = [baseResolved("tempoContato", { label: "TC", higherIsBetter: false })];
    const section = buildGoalsSection(goals, { tempoContato: 250 }, metrics);
    expect(section).toContain("atual:");
  });

  it("omite progresso quando valor atual é null", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "cmj",
        targetValue: 50,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, { cmj: null }, [baseResolved("cmj")]);
    expect(section).not.toContain("atual:");
  });

  it("usa higherIsBetter true quando métrica não resolvida mas há valor atual", () => {
    const goals: StudentGoal[] = [
      {
        id: "1",
        studentId: "s",
        userId: "u",
        metricKey: "orphan",
        targetValue: 100,
        targetDate: null,
        createdAt: "t",
      },
    ];
    const section = buildGoalsSection(goals, { orphan: 50 }, []);
    expect(section).toContain("50% da meta");
  });
});
