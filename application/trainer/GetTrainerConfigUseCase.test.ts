import { describe, it, expect, vi } from "vitest";
import { GetTrainerConfigUseCase } from "./GetTrainerConfigUseCase";
import { DEFAULT_METRICS } from "@/domain/trainer/services/DefaultMetrics";
import { MetricConfig, TrainerProfile } from "@/lib/types";

const userId = "user-1";

function makeProfileRepo(profile: TrainerProfile | null) {
  return { getByUserId: vi.fn().mockResolvedValue(profile), upsert: vi.fn() };
}

function makeMetricConfigRepo(configs: MetricConfig[] = []) {
  return { getByUserId: vi.fn().mockResolvedValue(configs), upsert: vi.fn(), delete: vi.fn() };
}

function emptyProfile(): TrainerProfile {
  return {
    id: "id",
    userId,
    coachingPhilosophy: "",
    sportContext: "",
    athleteProfiles: "",
    priorityFocus: "",
    customInstructions: "",
    updatedAt: "2025-01-01",
  };
}

describe("GetTrainerConfigUseCase", () => {
  it("repo vazio → retorna todos os defaults e context vazio", async () => {
    const useCase = new GetTrainerConfigUseCase(
      makeProfileRepo(null),
      makeMetricConfigRepo([])
    );
    const { resolvedMetrics, trainerContext } = await useCase.execute(userId);
    expect(resolvedMetrics).toHaveLength(DEFAULT_METRICS.length);
    expect(trainerContext).toBe("");
  });

  it("perfil preenchido → context inclui filosofia", async () => {
    const profile: TrainerProfile = {
      ...emptyProfile(),
      coachingPhilosophy: "Periodização ondulatória",
    };
    const useCase = new GetTrainerConfigUseCase(
      makeProfileRepo(profile),
      makeMetricConfigRepo([])
    );
    const { trainerContext } = await useCase.execute(userId);
    expect(trainerContext).toContain("Periodização ondulatória");
  });

  it("override de benchmark → valor do treinador no resolved", async () => {
    const overrides: MetricConfig[] = [
      {
        id: "x",
        userId,
        metricKey: "cmj",
        label: "CMJ",
        unit: "cm",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: true,
        benchRecreational: 35,
        benchTrained: 50,
        benchElite: 70,
        weight: 1,
        displayOrder: 0,
        createdAt: "2025-01-01",
      },
    ];
    const useCase = new GetTrainerConfigUseCase(
      makeProfileRepo(null),
      makeMetricConfigRepo(overrides)
    );
    const { resolvedMetrics } = await useCase.execute(userId);
    const cmj = resolvedMetrics.find((m) => m.key === "cmj")!;
    expect(cmj.benchRecreational).toBe(35);
    expect(cmj.benchTrained).toBe(50);
    expect(cmj.benchElite).toBe(70);
  });

  it("custom metric → aparece nos resolvedMetrics", async () => {
    const overrides: MetricConfig[] = [
      {
        id: "x",
        userId,
        metricKey: "triple_hop",
        label: "Triplo Salto",
        unit: "cm",
        higherIsBetter: true,
        isCustom: true,
        isEnabled: true,
        benchRecreational: 400,
        benchTrained: 550,
        benchElite: 700,
        weight: 1,
        displayOrder: 99,
        createdAt: "2025-01-01",
      },
    ];
    const useCase = new GetTrainerConfigUseCase(
      makeProfileRepo(null),
      makeMetricConfigRepo(overrides)
    );
    const { resolvedMetrics } = await useCase.execute(userId);
    const custom = resolvedMetrics.find((m) => m.key === "triple_hop");
    expect(custom).toBeDefined();
    expect(custom!.isCustom).toBe(true);
  });
});
