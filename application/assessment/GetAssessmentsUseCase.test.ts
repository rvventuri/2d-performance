import { describe, it, expect, vi } from "vitest";
import { GetAssessmentsUseCase } from "./GetAssessmentsUseCase";

describe("GetAssessmentsUseCase", () => {
  it("retorna avaliações do repositório", async () => {
    const assessments = [
      {
        id: "a1",
        studentId: "s1",
        date: "2025-01-01",
        metrics: {
          cmj: 40,
          sj: null,
          abalakov: null,
          rsi: null,
          tempoContato: null,
          alturaSaltoDJ: null,
          cmjEsquerdo: null,
          cmjDireito: null,
          assimetriaPercentual: null,
          saltoHorizontal: null,
        },
      },
    ];
    const repo = { getByStudentId: vi.fn().mockResolvedValue(assessments), create: vi.fn(), delete: vi.fn() };
    const useCase = new GetAssessmentsUseCase(repo);
    expect(await useCase.execute("s1")).toEqual(assessments);
    expect(repo.getByStudentId).toHaveBeenCalledWith("s1");
  });
});
