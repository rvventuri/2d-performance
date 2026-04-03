import { describe, it, expect } from "vitest";
import {
  buildTrainerContext,
  buildBenchmarkSection,
  buildWeightNote,
} from "./TrainerContextBuilder";
import { TrainerProfile, ResolvedMetricConfig } from "@/lib/types";
import { resolveMetricConfigs } from "./MetricConfigResolver";

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

describe("buildBenchmarkSection", () => {
  it("gera uma linha por métrica habilitada", () => {
    const resolved = resolveMetricConfigs([]);
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
