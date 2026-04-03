import { describe, it, expect } from "vitest";
import { resolveMetricConfigs, getEnabledMetrics } from "./MetricConfigResolver";
import { DEFAULT_METRICS } from "./DefaultMetrics";
import { MetricConfig } from "@/lib/types";

function makeOverride(partial: Partial<MetricConfig> & { metricKey: string }): MetricConfig {
  return {
    id: "test-id",
    userId: "user-1",
    label: partial.label ?? partial.metricKey,
    unit: partial.unit ?? "cm",
    higherIsBetter: partial.higherIsBetter ?? true,
    isCustom: partial.isCustom ?? false,
    isEnabled: partial.isEnabled ?? true,
    benchRecreational: partial.benchRecreational ?? null,
    benchTrained: partial.benchTrained ?? null,
    benchElite: partial.benchElite ?? null,
    weight: partial.weight ?? 1.0,
    displayOrder: partial.displayOrder ?? 0,
    createdAt: "2025-01-01",
    ...partial,
  };
}

describe("resolveMetricConfigs", () => {
  it("sem overrides → retorna todos os 10 defaults habilitados com peso 1.0", () => {
    const resolved = resolveMetricConfigs([]);
    expect(resolved).toHaveLength(DEFAULT_METRICS.length);
    for (const m of resolved) {
      expect(m.isEnabled).toBe(true);
      expect(m.weight).toBe(1.0);
      expect(m.isCustom).toBe(false);
    }
  });

  it("usa benchmarks do default quando override não especifica", () => {
    const resolved = resolveMetricConfigs([]);
    const cmj = resolved.find((m) => m.key === "cmj")!;
    expect(cmj.benchRecreational).toBe(30);
    expect(cmj.benchTrained).toBe(42);
    expect(cmj.benchElite).toBe(60);
  });

  it("override de benchmark do CMJ prevalece sobre default", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({ metricKey: "cmj", benchRecreational: 35, benchTrained: 50, benchElite: 70 }),
    ]);
    const cmj = resolved.find((m) => m.key === "cmj")!;
    expect(cmj.benchRecreational).toBe(35);
    expect(cmj.benchTrained).toBe(50);
    expect(cmj.benchElite).toBe(70);
  });

  it("desabilitar métrica → isEnabled = false", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({ metricKey: "rsi", isEnabled: false }),
    ]);
    const rsi = resolved.find((m) => m.key === "rsi")!;
    expect(rsi.isEnabled).toBe(false);
  });

  it("custom metric → aparece após defaults", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({
        metricKey: "triple_hop",
        label: "Triplo Salto",
        isCustom: true,
        displayOrder: 99,
        benchRecreational: 400,
        benchTrained: 550,
        benchElite: 700,
      }),
    ]);
    const custom = resolved.find((m) => m.key === "triple_hop")!;
    expect(custom).toBeDefined();
    expect(custom.isCustom).toBe(true);
    expect(custom.label).toBe("Triplo Salto");
    // Custom should come after defaults (all defaults have displayOrder 0–9)
    const defaultKeys = DEFAULT_METRICS.map((m) => m.key);
    const defaultIndices = defaultKeys.map((k) =>
      resolved.findIndex((m) => m.key === k)
    );
    const customIndex = resolved.findIndex((m) => m.key === "triple_hop");
    expect(customIndex).toBeGreaterThan(Math.max(...defaultIndices));
  });

  it("peso 2x na métrica → weight = 2", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({ metricKey: "rsi", weight: 2 }),
    ]);
    const rsi = resolved.find((m) => m.key === "rsi")!;
    expect(rsi.weight).toBe(2);
  });

  it("peso 0 → isEnabled permanece true, weight = 0", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({ metricKey: "cmj", weight: 0, isEnabled: true }),
    ]);
    const cmj = resolved.find((m) => m.key === "cmj")!;
    expect(cmj.isEnabled).toBe(true);
    expect(cmj.weight).toBe(0);
  });
});

describe("getEnabledMetrics", () => {
  it("filtra apenas métricas habilitadas", () => {
    const resolved = resolveMetricConfigs([
      makeOverride({ metricKey: "cmj", isEnabled: false }),
      makeOverride({ metricKey: "sj", isEnabled: false }),
    ]);
    const enabled = getEnabledMetrics(resolved);
    expect(enabled.every((m) => m.isEnabled)).toBe(true);
    expect(enabled.find((m) => m.key === "cmj")).toBeUndefined();
    expect(enabled.find((m) => m.key === "sj")).toBeUndefined();
  });
});
