import { describe, it, expect, vi } from "vitest";
import { InvalidateAnalysesUseCase } from "./InvalidateAnalysesUseCase";

describe("InvalidateAnalysesUseCase", () => {
  it("chama deleteAllForUser com o userId correto", async () => {
    const repo = { deleteAllForUser: vi.fn().mockResolvedValue(undefined) };
    const useCase = new InvalidateAnalysesUseCase(repo);
    await useCase.execute("user-1");
    expect(repo.deleteAllForUser).toHaveBeenCalledWith("user-1");
  });

  it("propaga erros do repositório", async () => {
    const repo = {
      deleteAllForUser: vi.fn().mockRejectedValue(new Error("DB error")),
    };
    const useCase = new InvalidateAnalysesUseCase(repo);
    await expect(useCase.execute("user-1")).rejects.toThrow("DB error");
  });
});
