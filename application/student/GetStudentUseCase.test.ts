import { describe, it, expect, vi } from "vitest";
import { GetStudentUseCase } from "./GetStudentUseCase";

describe("GetStudentUseCase", () => {
  it("retorna aluno por id", async () => {
    const student = { id: "1", name: "A", age: 1, weight: 1, height: 1, objective: "", photoUrl: null, createdAt: "t" };
    const repo = { getAll: vi.fn(), getById: vi.fn().mockResolvedValue(student), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
    const useCase = new GetStudentUseCase(repo);
    expect(await useCase.execute("1")).toEqual(student);
    expect(repo.getById).toHaveBeenCalledWith("1");
  });

  it("retorna null quando repositório retorna null", async () => {
    const repo = { getAll: vi.fn(), getById: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
    const useCase = new GetStudentUseCase(repo);
    expect(await useCase.execute("x")).toBeNull();
  });
});
