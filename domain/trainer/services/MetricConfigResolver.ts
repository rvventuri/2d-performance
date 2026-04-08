import { MetricConfig, ResolvedMetricConfig } from "@/lib/types";

/** Keys that map to denormalized columns on `assessments` (not only `custom_metric_values`). */
export const LEGACY_ASSESSMENT_METRIC_KEYS = [
  "cmj",
  "sj",
  "abalakov",
  "rsi",
  "tempoContato",
  "alturaSaltoDJ",
  "cmjEsquerdo",
  "cmjDireito",
  "assimetriaPercentual",
  "saltoHorizontal",
] as const;

export type LegacyAssessmentMetricKey = (typeof LEGACY_ASSESSMENT_METRIC_KEYS)[number];

const LEGACY_SET = new Set<string>(LEGACY_ASSESSMENT_METRIC_KEYS);

export function isLegacyAssessmentMetricKey(key: string): key is LegacyAssessmentMetricKey {
  return LEGACY_SET.has(key);
}

export function metricConfigToResolved(c: MetricConfig): ResolvedMetricConfig {
  return {
    key: c.metricKey,
    label: c.label,
    unit: c.unit,
    higherIsBetter: c.higherIsBetter,
    benchRecreational: c.benchRecreational ?? 0,
    benchTrained: c.benchTrained ?? 0,
    benchElite: c.benchElite ?? 0,
    isEnabled: c.isEnabled,
    weight: c.weight,
    isCustom: c.isCustom,
    displayOrder: c.displayOrder,
  };
}

/** Resolves the trainer catalog from DB rows only (no implicit system defaults). */
export function resolveMetricConfigs(configs: MetricConfig[]): ResolvedMetricConfig[] {
  return configs
    .map(metricConfigToResolved)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.key.localeCompare(b.key);
    });
}

export function getEnabledMetrics(
  resolved: ResolvedMetricConfig[]
): ResolvedMetricConfig[] {
  return resolved.filter((m) => m.isEnabled);
}
