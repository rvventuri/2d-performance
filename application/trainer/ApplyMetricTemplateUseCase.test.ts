import { describe, it, expect, vi } from "vitest";
import { ApplyMetricTemplateUseCase } from "./ApplyMetricTemplateUseCase";
import { SaveMetricConfigUseCase } from "./SaveMetricConfigUseCase";

const userId = "user-1";

describe("ApplyMetricTemplateUseCase", () => {
  it("aplica template preparador com múltiplos upserts", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const save = { execute } as unknown as SaveMetricConfigUseCase;
    const useCase = new ApplyMetricTemplateUseCase(save);
    const { appliedCount } = await useCase.execute(userId, "preparador_fisico");
    expect(appliedCount).toBeGreaterThan(0);
    expect(execute).toHaveBeenCalledTimes(appliedCount);
  });

  it("rejeita id desconhecido", async () => {
    const save = new SaveMetricConfigUseCase({
      getByUserId: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    });
    const useCase = new ApplyMetricTemplateUseCase(save);
    await expect(useCase.execute(userId, "nope")).rejects.toThrow("desconhecido");
  });
});
