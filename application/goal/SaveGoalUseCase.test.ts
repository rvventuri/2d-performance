import { describe, it, expect, vi } from "vitest";
import { SaveGoalUseCase } from "./SaveGoalUseCase";

describe("SaveGoalUseCase", () => {
  it("persiste meta com userId do construtor", async () => {
    const saved = {
      id: "g1",
      studentId: "s1",
      userId: "u1",
      metricKey: "cmj",
      targetValue: 50,
      targetDate: "2026-01-01",
      createdAt: "t",
    };
    const repo = {
      getByStudent: vi.fn(),
      save: vi.fn().mockResolvedValue(saved),
      delete: vi.fn(),
    };
    const useCase = new SaveGoalUseCase(repo, "u1");
    const result = await useCase.execute({
      studentId: "s1",
      metricKey: "cmj",
      targetValue: 50,
      targetDate: "2026-01-01",
    });
    expect(result).toEqual(saved);
    expect(repo.save).toHaveBeenCalledWith({
      studentId: "s1",
      userId: "u1",
      metricKey: "cmj",
      targetValue: 50,
      targetDate: "2026-01-01",
    });
  });

  it("usa targetDate null quando omitido", async () => {
    const repo = {
      getByStudent: vi.fn(),
      save: vi.fn().mockResolvedValue({ id: "g", studentId: "s", userId: "u", metricKey: "m", targetValue: 1, targetDate: null, createdAt: "t" }),
      delete: vi.fn(),
    };
    const useCase = new SaveGoalUseCase(repo, "u");
    await useCase.execute({ studentId: "s", metricKey: "m", targetValue: 1 });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ targetDate: null })
    );
  });
});
