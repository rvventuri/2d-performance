import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";
import { DEFAULT_METRIC_MAP } from "@/domain/trainer/services/DefaultMetrics";

export class DeleteCustomMetricUseCase {
  constructor(private readonly metricConfigRepo: IMetricConfigRepository) {}

  async execute(userId: string, metricKey: string): Promise<void> {
    if (DEFAULT_METRIC_MAP[metricKey]) {
      throw new Error(
        `Não é possível excluir métrica padrão: ${metricKey}. Use desabilitar.`
      );
    }
    await this.metricConfigRepo.delete(userId, metricKey);
  }
}
