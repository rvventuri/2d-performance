import { describe, it, expect, vi } from "vitest";
import { GetGoalsUseCase } from "./GetGoalsUseCase";

describe("GetGoalsUseCase", () => {
  it("delega ao repositório", async () => {
    const goals = [
      { id: "g1", studentId: "s1", userId: "u1", metricKey: "cmj", targetValue: 50, targetDate: null, createdAt: "t" },
    ];
    const repo = { getByStudent: vi.fn().mockResolvedValue(goals), save: vi.fn(), delete: vi.fn() };
    const useCase = new GetGoalsUseCase(repo);
    expect(await useCase.execute("s1")).toEqual(goals);
    expect(repo.getByStudent).toHaveBeenCalledWith("s1");
  });
});
