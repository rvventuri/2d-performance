import { describe, it, expect, vi } from "vitest";
import { GetAdminMetricsUseCase } from "./GetAdminMetricsUseCase";

describe("GetAdminMetricsUseCase", () => {
  it("retorna métricas do repositório", async () => {
    const metrics = {
      totalTrainers: 1,
      newTrainersLast30Days: 0,
      totalStudents: 2,
      totalAssessments: 3,
      aiAnalysesByStatus: { done: 1, pending: 0, running: 0, error: 0 },
      aiUsageStats: { avgDurationMs: null, totalInputTokens: 0, totalOutputTokens: 0 },
      signupsPerMonth: [],
      topTrainers: [],
    };
    const repo = { getMetrics: vi.fn().mockResolvedValue(metrics) };
    const useCase = new GetAdminMetricsUseCase(repo);
    expect(await useCase.execute()).toEqual(metrics);
    expect(repo.getMetrics).toHaveBeenCalledOnce();
  });
});
