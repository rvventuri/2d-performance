import { describe, it, expect, vi } from "vitest";
import { DeleteGoalUseCase } from "./DeleteGoalUseCase";

describe("DeleteGoalUseCase", () => {
  it("delega delete ao repositório", async () => {
    const repo = { getByStudent: vi.fn(), save: vi.fn(), delete: vi.fn().mockResolvedValue(undefined) };
    const useCase = new DeleteGoalUseCase(repo);
    await useCase.execute("s1", "cmj");
    expect(repo.delete).toHaveBeenCalledWith("s1", "cmj");
  });
});
