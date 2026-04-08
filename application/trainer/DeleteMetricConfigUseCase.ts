import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";

export class DeleteMetricConfigUseCase {
  constructor(private readonly metricConfigRepo: IMetricConfigRepository) {}

  async execute(userId: string, metricKey: string): Promise<void> {
    await this.metricConfigRepo.delete(userId, metricKey);
  }
}
