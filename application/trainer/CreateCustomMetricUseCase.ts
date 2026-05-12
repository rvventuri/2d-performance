import { MetricConfig } from "@/lib/types";
import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";
import { DEFAULT_METRIC_MAP } from "@/domain/trainer/services/DefaultMetrics";
import { MetricWeight } from "@/domain/trainer/value-objects/MetricWeight";

export interface CreateCustomMetricInput {
  label: string;
  unit: string;
  higherIsBetter: boolean;
  benchRecreational: number | null;
  benchTrained: number | null;
  benchElite: number | null;
  weight: number;
  displayOrder: number;
}

export class CreateCustomMetricUseCase {
  constructor(private readonly metricConfigRepo: IMetricConfigRepository) {}

  async execute(
    userId: string,
    input: CreateCustomMetricInput
  ): Promise<MetricConfig> {
    // Generate unique metric_key that never conflicts with defaults
    const metricKey = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    /* v8 ignore next — collision is practically impossible (timestamp + random suffix) */
    if (DEFAULT_METRIC_MAP[metricKey]) {
      throw new Error(`Chave de métrica conflita com métrica padrão: ${metricKey}`);
    }

    // Validate weight
    MetricWeight.create(input.weight);

    return this.metricConfigRepo.upsert(userId, {
      metricKey,
      label: input.label,
      unit: input.unit,
      higherIsBetter: input.higherIsBetter,
      isCustom: true,
      isEnabled: true,
      benchRecreational: input.benchRecreational,
      benchTrained: input.benchTrained,
      benchElite: input.benchElite,
      weight: input.weight,
      displayOrder: input.displayOrder,
    });
  }
}
