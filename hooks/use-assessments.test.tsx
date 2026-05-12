import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAssessments } from "./use-assessments";

vi.mock("@/lib/storage", () => ({
  getStudentAssessments: vi.fn(),
}));

import { getStudentAssessments } from "@/lib/storage";

describe("useAssessments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sem studentId não busca", async () => {
    const { result } = renderHook(() => useAssessments(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getStudentAssessments).not.toHaveBeenCalled();
    expect(result.current.assessments).toEqual([]);
  });

  it("carrega avaliações", async () => {
    const data = [
      {
        id: "a",
        studentId: "s",
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
    vi.mocked(getStudentAssessments).mockResolvedValue(data);
    const { result } = renderHook(() => useAssessments("s"));
    await waitFor(() => expect(result.current.assessments).toEqual(data));
  });

  it("erro ao carregar", async () => {
    vi.mocked(getStudentAssessments).mockRejectedValue("x");
    const { result } = renderHook(() => useAssessments("s"));
    await waitFor(() => expect(result.current.error).toBe("Erro ao carregar avaliações"));
  });

  it("propaga mensagem de Error", async () => {
    vi.mocked(getStudentAssessments).mockRejectedValue(new Error("falha-db"));
    const { result } = renderHook(() => useAssessments("s"));
    await waitFor(() => expect(result.current.error).toBe("falha-db"));
  });
});
