import { describe, it, expect, vi } from "vitest";
import { DeleteMetricConfigUseCase } from "./DeleteMetricConfigUseCase";

function makeRepo() {
  return {
    getByUserId: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("DeleteMetricConfigUseCase", () => {
  it("delega delete ao repositório", async () => {
    const repo = makeRepo();
    const useCase = new DeleteMetricConfigUseCase(repo);
    await useCase.execute("user-1", "cmj");
    expect(repo.delete).toHaveBeenCalledWith("user-1", "cmj");
  });
});
