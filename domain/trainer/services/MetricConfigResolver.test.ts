import { describe, it, expect } from "vitest";
import { resolveMetricConfigs, getEnabledMetrics, metricConfigToResolved } from "./MetricConfigResolver";
import { MetricConfig } from "@/lib/types";

function makeConfig(partial: Partial<MetricConfig> & { metricKey: string }): MetricConfig {
  return {
    id: "test-id",
    userId: "user-1",
    label: partial.label ?? partial.metricKey,
    unit: partial.unit ?? "",
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
  it("sem configs → lista vazia", () => {
    expect(resolveMetricConfigs([])).toEqual([]);
  });

  it("mapeia linha do banco para ResolvedMetricConfig", () => {
    const resolved = resolveMetricConfigs([
      makeConfig({
        metricKey: "cmj",
        label: "CMJ",
        unit: "cm",
        benchRecreational: 30,
        benchTrained: 42,
        benchElite: 60,
        isCustom: false,
        displayOrder: 0,
      }),
    ]);
    expect(resolved).toHaveLength(1);
    const cmj = resolved[0]!;
    expect(cmj.key).toBe("cmj");
    expect(cmj.label).toBe("CMJ");
    expect(cmj.benchRecreational).toBe(30);
    expect(cmj.isCustom).toBe(false);
  });

  it("benchmarks null viram 0", () => {
    const r = metricConfigToResolved(
      makeConfig({ metricKey: "x", benchRecreational: null, benchTrained: null, benchElite: null })
    );
    expect(r.benchRecreational).toBe(0);
    expect(r.benchTrained).toBe(0);
    expect(r.benchElite).toBe(0);
  });

  it("ordena por displayOrder", () => {
    const resolved = resolveMetricConfigs([
      makeConfig({ metricKey: "b", displayOrder: 2 }),
      makeConfig({ metricKey: "a", displayOrder: 1 }),
    ]);
    expect(resolved.map((m) => m.key)).toEqual(["a", "b"]);
  });

  it("métrica custom aparece junto às demais conforme displayOrder", () => {
    const resolved = resolveMetricConfigs([
      makeConfig({ metricKey: "triple_hop", label: "Triplo", isCustom: true, displayOrder: 0 }),
      makeConfig({ metricKey: "cmj", displayOrder: 1 }),
    ]);
    expect(resolved[0]!.key).toBe("triple_hop");
    expect(resolved[0]!.isCustom).toBe(true);
  });

  it("desabilitar métrica → isEnabled = false", () => {
    const resolved = resolveMetricConfigs([
      makeConfig({ metricKey: "rsi", isEnabled: false }),
    ]);
    expect(resolved[0]!.isEnabled).toBe(false);
  });
});

describe("getEnabledMetrics", () => {
  it("filtra apenas métricas habilitadas", () => {
    const resolved = resolveMetricConfigs([
      makeConfig({ metricKey: "cmj", isEnabled: false }),
      makeConfig({ metricKey: "sj", isEnabled: true }),
    ]);
    const enabled = getEnabledMetrics(resolved);
    expect(enabled).toHaveLength(1);
    expect(enabled[0]!.key).toBe("sj");
  });
});
