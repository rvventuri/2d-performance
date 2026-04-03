import { MetricConfig } from "@/lib/types";
import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";
import { MetricWeight } from "@/domain/trainer/value-objects/MetricWeight";

export class SaveMetricConfigUseCase {
  constructor(private readonly metricConfigRepo: IMetricConfigRepository) {}

  async execute(
    userId: string,
    config: Omit<MetricConfig, "id" | "userId" | "createdAt">
  ): Promise<MetricConfig> {
    // Validate weight before saving
    MetricWeight.create(config.weight);
    return this.metricConfigRepo.upsert(userId, config);
  }
}
