import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useStudents } from "./use-students";

vi.mock("@/lib/storage", () => ({
  getStudents: vi.fn(),
}));

import { getStudents } from "@/lib/storage";

describe("useStudents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("carrega alunos com sucesso", async () => {
    const list = [{ id: "1", name: "A", age: 1, weight: 1, height: 1, objective: "", photoUrl: null, createdAt: "t" }];
    vi.mocked(getStudents).mockResolvedValue(list);
    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.students).toEqual(list);
    expect(result.current.error).toBeNull();
  });

  it("define erro quando getStudents falha", async () => {
    vi.mocked(getStudents).mockRejectedValue(new Error("falha"));
    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("falha");
    expect(result.current.students).toEqual([]);
  });

  it("usa mensagem genérica quando rejeição não é Error", async () => {
    vi.mocked(getStudents).mockRejectedValue("boom");
    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Erro ao carregar alunos");
  });

  it("refresh recarrega", async () => {
    vi.mocked(getStudents).mockResolvedValue([]);
    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(getStudents).mockResolvedValue([
      { id: "2", name: "B", age: 1, weight: 1, height: 1, objective: "", photoUrl: null, createdAt: "t" },
    ]);
    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(result.current.students).toHaveLength(1));
  });
});
