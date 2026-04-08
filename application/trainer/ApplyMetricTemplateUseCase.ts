import { getMetricTemplateById } from "@/domain/trainer/services/MetricTemplates";
import { SaveMetricConfigUseCase } from "./SaveMetricConfigUseCase";

export class ApplyMetricTemplateUseCase {
  constructor(private readonly saveMetricConfig: SaveMetricConfigUseCase) {}

  async execute(userId: string, templateId: string): Promise<{ appliedCount: number }> {
    const template = getMetricTemplateById(templateId);
    if (!template) {
      throw new Error(`Template de métricas desconhecido: ${templateId}`);
    }

    for (const m of template.metrics) {
      await this.saveMetricConfig.execute(userId, {
        metricKey: m.metricKey,
        label: m.label,
        unit: m.unit,
        higherIsBetter: m.higherIsBetter,
        isCustom: m.isCustom,
        isEnabled: m.isEnabled,
        benchRecreational: m.benchRecreational,
        benchTrained: m.benchTrained,
        benchElite: m.benchElite,
        weight: m.weight,
        displayOrder: m.displayOrder,
      });
    }

    return { appliedCount: template.metrics.length };
  }
}
