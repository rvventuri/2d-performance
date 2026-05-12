import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStudentDetail } from "./use-student-detail";

vi.mock("@/lib/storage", () => ({
  getStudent: vi.fn(),
  getStudentAssessments: vi.fn(),
  getMetricConfigs: vi.fn(),
}));

import { getStudent, getStudentAssessments, getMetricConfigs } from "@/lib/storage";

describe("useStudentDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("notFound quando aluno não existe", async () => {
    vi.mocked(getStudent).mockResolvedValue(null);
    vi.mocked(getStudentAssessments).mockResolvedValue([]);
    vi.mocked(getMetricConfigs).mockResolvedValue([]);
    const { result } = renderHook(() => useStudentDetail("missing"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
    expect(result.current.student).toBeNull();
  });

  it("carrega aluno e métricas resolvidas", async () => {
    const student = { id: "1", name: "A", age: 1, weight: 1, height: 1, objective: "", photoUrl: null, createdAt: "t" };
    vi.mocked(getStudent).mockResolvedValue(student);
    vi.mocked(getStudentAssessments).mockResolvedValue([]);
    vi.mocked(getMetricConfigs).mockResolvedValue([]);
    const { result } = renderHook(() => useStudentDetail("1"));
    await waitFor(() => expect(result.current.student).toEqual(student));
    expect(result.current.resolvedMetrics).toEqual([]);
  });

  it("erro genérico", async () => {
    vi.mocked(getStudent).mockRejectedValue(new Error("db"));
    vi.mocked(getStudentAssessments).mockRejectedValue(new Error("db"));
    vi.mocked(getMetricConfigs).mockRejectedValue(new Error("db"));
    const { result } = renderHook(() => useStudentDetail("1"));
    await waitFor(() => expect(result.current.error).toBe("db"));
  });

  it("erro genérico quando falha não é Error", async () => {
    vi.mocked(getStudent).mockRejectedValue("boom");
    vi.mocked(getStudentAssessments).mockResolvedValue([]);
    vi.mocked(getMetricConfigs).mockResolvedValue([]);
    const { result } = renderHook(() => useStudentDetail("1"));
    await waitFor(() => expect(result.current.error).toBe("Erro ao carregar dados do aluno"));
  });
});
