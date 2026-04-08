import { describe, it, expect, vi } from "vitest";
import { ClearDemoDataUseCase } from "./ClearDemoDataUseCase";
import type { IDemoTemplateRepository } from "@/domain/demo/repositories/IDemoTemplateRepository";

const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function makeRepo(overrides: Partial<IDemoTemplateRepository> = {}): IDemoTemplateRepository {
  return {
    cloneDemoFromTemplateUser: vi.fn(),
    clearDemoStudents: vi.fn().mockResolvedValue(3),
    markDemoCleared: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("ClearDemoDataUseCase", () => {
  it("remove alunos demo e marca cleared", async () => {
    const repo = makeRepo();
    const useCase = new ClearDemoDataUseCase(repo);
    const r = await useCase.execute(userId);
    expect(r).toEqual({ deletedStudents: 3 });
    expect(repo.clearDemoStudents).toHaveBeenCalledWith(userId);
    expect(repo.markDemoCleared).toHaveBeenCalledWith(userId);
  });

  it("lança se repositório é null", async () => {
    const useCase = new ClearDemoDataUseCase(null);
    await expect(useCase.execute(userId)).rejects.toThrow(/admin não configurado/);
  });

  it("propaga erro do repositório", async () => {
    const repo = makeRepo({
      clearDemoStudents: vi.fn().mockRejectedValue(new Error("DB falhou")),
    });
    const useCase = new ClearDemoDataUseCase(repo);
    await expect(useCase.execute(userId)).rejects.toThrow("DB falhou");
    expect(repo.markDemoCleared).not.toHaveBeenCalled();
  });
});
