"use server";

import { createClient } from "@/lib/supabase/server";
import { TrainerProfile, MetricConfig } from "@/lib/types";
import { SupabaseTrainerProfileRepository } from "@/infrastructure/supabase/TrainerProfileRepository";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { SaveTrainerProfileUseCase } from "@/application/trainer/SaveTrainerProfileUseCase";
import { SaveMetricConfigUseCase } from "@/application/trainer/SaveMetricConfigUseCase";
import { CreateCustomMetricUseCase, CreateCustomMetricInput } from "@/application/trainer/CreateCustomMetricUseCase";
import { DeleteCustomMetricUseCase } from "@/application/trainer/DeleteCustomMetricUseCase";
import { InvalidateAnalysesUseCase } from "@/application/trainer/InvalidateAnalysesUseCase";

async function getRepos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return {
    userId: user.id,
    profileRepo: new SupabaseTrainerProfileRepository(supabase, user.id),
    metricRepo: new SupabaseMetricConfigRepository(supabase, user.id),
    analysisRepo: {
      deleteAllForUser: async (uid: string) => {
        await supabase.from("ai_analyses").delete().eq("user_id", uid);
      },
    },
  };
}

export async function saveTrainerProfile(
  data: Omit<TrainerProfile, "id" | "userId" | "updatedAt">
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId, profileRepo } = await getRepos();
    await new SaveTrainerProfileUseCase(profileRepo).execute(userId, data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function saveMetricConfig(
  config: Omit<MetricConfig, "id" | "userId" | "createdAt">
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId, metricRepo } = await getRepos();
    await new SaveMetricConfigUseCase(metricRepo).execute(userId, config);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function createCustomMetric(
  input: CreateCustomMetricInput
): Promise<{ ok: true; metric: MetricConfig } | { ok: false; error: string }> {
  try {
    const { userId, metricRepo } = await getRepos();
    const metric = await new CreateCustomMetricUseCase(metricRepo).execute(userId, input);
    return { ok: true, metric };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao criar" };
  }
}

export async function deleteCustomMetric(
  metricKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId, metricRepo } = await getRepos();
    await new DeleteCustomMetricUseCase(metricRepo).execute(userId, metricKey);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir" };
  }
}

export async function invalidateAllAnalyses(): Promise<void> {
  try {
    const { userId, analysisRepo } = await getRepos();
    await new InvalidateAnalysesUseCase(analysisRepo).execute(userId);
  } catch {
    // Non-critical: don't block the user
  }
}
