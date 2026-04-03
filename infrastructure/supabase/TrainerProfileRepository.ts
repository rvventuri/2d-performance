import { TrainerProfile } from "@/lib/types";
import { ITrainerProfileRepository } from "@/domain/trainer/repositories/ITrainerProfileRepository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTrainerProfile(row: any): TrainerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    coachingPhilosophy: row.coaching_philosophy ?? "",
    sportContext: row.sport_context ?? "",
    athleteProfiles: row.athlete_profiles ?? "",
    priorityFocus: row.priority_focus ?? "",
    customInstructions: row.custom_instructions ?? "",
    updatedAt: row.updated_at,
  };
}

export class SupabaseTrainerProfileRepository
  implements ITrainerProfileRepository
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any, private readonly userId: string) {}

  async getByUserId(userId: string): Promise<TrainerProfile | null> {
    const { data, error } = await this.supabase
      .from("trainer_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return rowToTrainerProfile(data);
  }

  async upsert(
    userId: string,
    profile: Omit<TrainerProfile, "id" | "userId" | "updatedAt">
  ): Promise<TrainerProfile> {
    const { data, error } = await this.supabase
      .from("trainer_profiles")
      .upsert(
        {
          user_id: userId,
          coaching_philosophy: profile.coachingPhilosophy || null,
          sport_context: profile.sportContext || null,
          athlete_profiles: profile.athleteProfiles || null,
          priority_focus: profile.priorityFocus || null,
          custom_instructions: profile.customInstructions || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToTrainerProfile(data);
  }
}
