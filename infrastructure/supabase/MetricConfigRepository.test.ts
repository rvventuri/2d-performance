import { describe, it, expect, vi } from "vitest";
import { SupabaseMetricConfigRepository } from "./MetricConfigRepository";

const userId = "user-123";

const dbRow = {
  id: "mc-1",
  user_id: userId,
  metric_key: "cmj",
  label: "CMJ",
  unit: "cm",
  higher_is_better: true,
  is_custom: false,
  is_enabled: true,
  bench_recreational: 35,
  bench_trained: 50,
  bench_elite: 70,
  weight: "2.00",
  display_order: 0,
  created_at: "2025-01-01T00:00:00Z",
};

describe("SupabaseMetricConfigRepository.getByUserId", () => {
  it("retorna lista mapeada e ordenada", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [dbRow], error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).toHaveLength(1);
    expect(result[0].metricKey).toBe("cmj");
    expect(result[0].weight).toBe(2); // parsed from string "2.00"
    expect(result[0].benchRecreational).toBe(35);
  });

  it("retorna lista vazia quando não há rows", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).toEqual([]);
  });
});

describe("SupabaseMetricConfigRepository.upsert", () => {
  it("chama upsert com onConflict user_id,metric_key", async () => {
    const single = vi.fn().mockResolvedValue({ data: dbRow, error: null });
    const upsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertFn }) };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    await repo.upsert(userId, {
      metricKey: "cmj",
      label: "CMJ",
      unit: "cm",
      higherIsBetter: true,
      isCustom: false,
      isEnabled: true,
      benchRecreational: 35,
      benchTrained: 50,
      benchElite: 70,
      weight: 2,
      displayOrder: 0,
    });
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userId, metric_key: "cmj" }),
      { onConflict: "user_id,metric_key" }
    );
  });
});

describe("SupabaseMetricConfigRepository.delete", () => {
  it("só deleta linhas com is_custom = true", async () => {
    const eqFn = vi.fn().mockReturnValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: eqFn,
        }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ delete: deleteFn }) };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    await repo.delete(userId, "triple_hop");
    // The last .eq() should filter is_custom = true
    expect(eqFn).toHaveBeenCalledWith("is_custom", true);
  });
});
