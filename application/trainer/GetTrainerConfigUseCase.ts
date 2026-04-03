import { ResolvedMetricConfig } from "@/lib/types";
import { ITrainerProfileRepository } from "@/domain/trainer/repositories/ITrainerProfileRepository";
import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import { buildTrainerContext } from "@/domain/trainer/services/TrainerContextBuilder";

export interface TrainerConfig {
  resolvedMetrics: ResolvedMetricConfig[];
  trainerContext: string;
}

export class GetTrainerConfigUseCase {
  constructor(
    private readonly profileRepo: ITrainerProfileRepository,
    private readonly metricConfigRepo: IMetricConfigRepository
  ) {}

  async execute(userId: string): Promise<TrainerConfig> {
    const [profile, configs] = await Promise.all([
      this.profileRepo.getByUserId(userId),
      this.metricConfigRepo.getByUserId(userId),
    ]);

    const resolvedMetrics = resolveMetricConfigs(configs);
    const trainerContext = buildTrainerContext(profile);

    return { resolvedMetrics, trainerContext };
  }
}
