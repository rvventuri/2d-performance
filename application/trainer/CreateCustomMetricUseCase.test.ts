import { describe, it, expect, vi } from "vitest";
import { CreateCustomMetricUseCase } from "./CreateCustomMetricUseCase";
import { MetricConfig } from "@/lib/types";

const userId = "user-1";

function makeRepo(result?: Partial<MetricConfig>) {
  return {
    getByUserId: vi.fn(),
    upsert: vi.fn().mockResolvedValue({ id: "new-id", ...result }),
    delete: vi.fn(),
  };
}

describe("CreateCustomMetricUseCase", () => {
  it("cria métrica com metric_key único não conflitante com defaults", async () => {
    const repo = makeRepo();
    const useCase = new CreateCustomMetricUseCase(repo);
    await useCase.execute(userId, {
      label: "Triplo Salto",
      unit: "cm",
      higherIsBetter: true,
      benchRecreational: 400,
      benchTrained: 550,
      benchElite: 700,
      weight: 1,
      displayOrder: 10,
    });
    expect(repo.upsert).toHaveBeenCalledOnce();
    const call = repo.upsert.mock.calls[0][1];
    expect(call.metricKey).toMatch(/^custom_/);
    expect(call.isCustom).toBe(true);
  });

  it("rejeita peso inválido (1.2)", async () => {
    const repo = makeRepo();
    const useCase = new CreateCustomMetricUseCase(repo);
    await expect(
      useCase.execute(userId, {
        label: "Teste",
        unit: "cm",
        higherIsBetter: true,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 1.2,
        displayOrder: 0,
      })
    ).rejects.toThrow("Peso inválido");
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});

describe("DeleteMetricConfigUseCase", () => {
  it("deleta qualquer métrica do catálogo do usuário", async () => {
    const { DeleteMetricConfigUseCase } = await import("./DeleteMetricConfigUseCase");
    const repo = makeRepo();
    const useCase = new DeleteMetricConfigUseCase(repo);
    await useCase.execute(userId, "cmj");
    expect(repo.delete).toHaveBeenCalledWith(userId, "cmj");
  });

  it("deleta métrica custom", async () => {
    const { DeleteMetricConfigUseCase } = await import("./DeleteMetricConfigUseCase");
    const repo = makeRepo();
    const useCase = new DeleteMetricConfigUseCase(repo);
    await useCase.execute(userId, "custom_123_abc");
    expect(repo.delete).toHaveBeenCalledWith(userId, "custom_123_abc");
  });
});
