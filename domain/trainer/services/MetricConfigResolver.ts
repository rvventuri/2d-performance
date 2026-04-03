import { MetricConfig, ResolvedMetricConfig } from "@/lib/types";
import { DEFAULT_METRICS, DEFAULT_METRIC_MAP } from "./DefaultMetrics";

export function resolveMetricConfigs(
  overrides: MetricConfig[]
): ResolvedMetricConfig[] {
  const overrideMap: Record<string, MetricConfig> = {};
  for (const o of overrides) overrideMap[o.metricKey] = o;

  const resolved: ResolvedMetricConfig[] = DEFAULT_METRICS.map((def, idx) => {
    const ov = overrideMap[def.key];
    return {
      key: def.key,
      label: ov?.label ?? def.label,
      unit: ov?.unit ?? def.unit,
      higherIsBetter: ov?.higherIsBetter ?? def.higherIsBetter,
      benchRecreational: ov?.benchRecreational ?? def.benchRecreational,
      benchTrained: ov?.benchTrained ?? def.benchTrained,
      benchElite: ov?.benchElite ?? def.benchElite,
      isEnabled: ov?.isEnabled ?? true,
      weight: ov?.weight ?? 1.0,
      isCustom: false,
      displayOrder: ov?.displayOrder ?? idx,
    };
  });

  // Append custom metrics (only those that are not default keys)
  for (const ov of overrides.filter((o) => o.isCustom)) {
    if (DEFAULT_METRIC_MAP[ov.metricKey]) continue;
    resolved.push({
      key: ov.metricKey,
      label: ov.label,
      unit: ov.unit,
      higherIsBetter: ov.higherIsBetter,
      benchRecreational: ov.benchRecreational ?? 0,
      benchTrained: ov.benchTrained ?? 0,
      benchElite: ov.benchElite ?? 0,
      isEnabled: ov.isEnabled,
      weight: ov.weight,
      isCustom: true,
      displayOrder: ov.displayOrder,
    });
  }

  return resolved.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getEnabledMetrics(
  resolved: ResolvedMetricConfig[]
): ResolvedMetricConfig[] {
  return resolved.filter((m) => m.isEnabled);
}
