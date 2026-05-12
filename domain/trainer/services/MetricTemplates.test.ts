import { describe, it, expect } from "vitest";
import {
  METRIC_TEMPLATES,
  MODALITY_PICKER_OPTIONS,
  getMetricTemplateById,
  tpl,
} from "./MetricTemplates";

describe("MetricTemplates", () => {
  it("cada template tem id e métricas", () => {
    for (const t of METRIC_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.metrics.length).toBeGreaterThan(0);
    }
  });

  it("MODALITY_PICKER_OPTIONS alinhado aos templates", () => {
    expect(MODALITY_PICKER_OPTIONS).toHaveLength(METRIC_TEMPLATES.length);
    expect(MODALITY_PICKER_OPTIONS.map((o) => o.id)).toEqual(METRIC_TEMPLATES.map((t) => t.id));
  });

  it("getMetricTemplateById retorna template ou null", () => {
    expect(getMetricTemplateById("personal_trainer_strength")).not.toBeNull();
    expect(getMetricTemplateById("nope")).toBeNull();
  });

  it("tpl marca métrica legada como não custom", () => {
    const m = tpl({
      metricKey: "cmj",
      label: "CMJ",
      unit: "cm",
      higherIsBetter: true,
      displayOrder: 0,
    });
    expect(m.isCustom).toBe(false);
    expect(m.isEnabled).toBe(true);
  });

  it("tpl marca chave não legada como custom", () => {
    const m = tpl({
      metricKey: "loadKg",
      label: "Carga",
      unit: "kg",
      higherIsBetter: true,
      displayOrder: 0,
    });
    expect(m.isCustom).toBe(true);
  });

  it("tpl respeita isEnabled false", () => {
    const m = tpl({
      metricKey: "loadKg",
      label: "Carga",
      unit: "kg",
      higherIsBetter: true,
      displayOrder: 0,
      isEnabled: false,
    });
    expect(m.isEnabled).toBe(false);
  });

  it("tpl usa null em benchmarks omitidos", () => {
    const m = tpl({
      metricKey: "loadKg",
      label: "Carga",
      unit: "kg",
      higherIsBetter: true,
      displayOrder: 0,
    });
    expect(m.benchRecreational).toBeNull();
    expect(m.weight).toBe(1);
  });
});
