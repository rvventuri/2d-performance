import { describe, it, expect } from "vitest";
import { DEFAULT_METRICS, DEFAULT_METRIC_MAP } from "./DefaultMetrics";

describe("DefaultMetrics", () => {
  it("mantém chaves únicas", () => {
    const keys = DEFAULT_METRICS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("DEFAULT_METRIC_MAP cobre todas as métricas", () => {
    for (const m of DEFAULT_METRICS) {
      expect(DEFAULT_METRIC_MAP[m.key]).toEqual(m);
    }
  });
});
