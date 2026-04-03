import { TrainerProfile } from "@/lib/types";
import { ITrainerProfileRepository } from "@/domain/trainer/repositories/ITrainerProfileRepository";

export class SaveTrainerProfileUseCase {
  constructor(private readonly profileRepo: ITrainerProfileRepository) {}

  async execute(
    userId: string,
    data: Omit<TrainerProfile, "id" | "userId" | "updatedAt">
  ): Promise<TrainerProfile> {
    return this.profileRepo.upsert(userId, data);
  }
}
