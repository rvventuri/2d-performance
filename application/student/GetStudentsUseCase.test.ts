import { describe, it, expect, vi } from "vitest";
import { GetStudentsUseCase } from "./GetStudentsUseCase";

describe("GetStudentsUseCase", () => {
  it("retorna lista do repositório", async () => {
    const students = [{ id: "1", name: "A", age: 1, weight: 1, height: 1, objective: "", photoUrl: null, createdAt: "t" }];
    const repo = { getAll: vi.fn().mockResolvedValue(students), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
    const useCase = new GetStudentsUseCase(repo);
    const result = await useCase.execute();
    expect(result).toEqual(students);
    expect(repo.getAll).toHaveBeenCalledOnce();
  });
});
