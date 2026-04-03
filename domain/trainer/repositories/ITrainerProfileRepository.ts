import { TrainerProfile } from "@/lib/types";

export interface ITrainerProfileRepository {
  getByUserId(userId: string): Promise<TrainerProfile | null>;
  upsert(
    userId: string,
    data: Omit<TrainerProfile, "id" | "userId" | "updatedAt">
  ): Promise<TrainerProfile>;
}
