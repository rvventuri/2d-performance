import { describe, it, expect, vi } from "vitest";
import { SaveMetricConfigUseCase } from "./SaveMetricConfigUseCase";
import { MetricConfig } from "@/lib/types";

const userId = "user-1";

function makeRepo(saved: Partial<MetricConfig> = {}) {
  return {
    getByUserId: vi.fn(),
    upsert: vi.fn().mockResolvedValue({ id: "new-id", userId, createdAt: "2025-01-01", ...saved }),
    delete: vi.fn(),
  };
}

describe("SaveMetricConfigUseCase", () => {
  it("chama upsert com config válida (peso 1.0)", async () => {
    const repo = makeRepo();
    const useCase = new SaveMetricConfigUseCase(repo);
    const config = {
      metricKey: "cmj",
      label: "CMJ",
      unit: "cm",
      higherIsBetter: true,
      isCustom: false,
      isEnabled: true,
      benchRecreational: 35,
      benchTrained: 50,
      benchElite: 70,
      weight: 1.0,
      displayOrder: 0,
    };
    await useCase.execute(userId, config);
    expect(repo.upsert).toHaveBeenCalledWith(userId, config);
  });

  it("aceita peso 0 (desabilitar contribuição)", async () => {
    const repo = makeRepo();
    const useCase = new SaveMetricConfigUseCase(repo);
    await useCase.execute(userId, {
      metricKey: "cmj",
      label: "CMJ",
      unit: "cm",
      higherIsBetter: true,
      isCustom: false,
      isEnabled: true,
      benchRecreational: null,
      benchTrained: null,
      benchElite: null,
      weight: 0,
      displayOrder: 0,
    });
    expect(repo.upsert).toHaveBeenCalled();
  });

  it("rejeita peso inválido sem chamar upsert", async () => {
    const repo = makeRepo();
    const useCase = new SaveMetricConfigUseCase(repo);
    await expect(
      useCase.execute(userId, {
        metricKey: "cmj",
        label: "CMJ",
        unit: "cm",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: true,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 2.2,
        displayOrder: 0,
      })
    ).rejects.toThrow("Peso inválido");
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
