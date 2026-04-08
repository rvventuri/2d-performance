"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClientOrNull } from "@/lib/supabase/admin";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { SupabaseDemoTemplateRepository } from "@/infrastructure/supabase/DemoTemplateRepository";
import { SaveMetricConfigUseCase } from "@/application/trainer/SaveMetricConfigUseCase";
import { ApplyMetricTemplateUseCase } from "@/application/trainer/ApplyMetricTemplateUseCase";
import { InvalidateAnalysesUseCase } from "@/application/trainer/InvalidateAnalysesUseCase";
import { getMetricTemplateById } from "@/domain/trainer/services/MetricTemplates";
import { getDemoSeedUserIdForTemplate } from "@/lib/demo-seed-users";

export type CompleteModalityResult =
  | { ok: true; demoCloned: boolean; alreadyCompleted?: boolean }
  | { ok: false; error: string };

export async function completeModalityOnboardingAction(
  templateId: string
): Promise<CompleteModalityResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  if (!getMetricTemplateById(templateId)) {
    return { ok: false, error: "Modalidade inválida." };
  }

  const { data: existing } = await supabase
    .from("user_demo_state")
    .select("modality_chosen_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.modality_chosen_at) {
    return { ok: true, demoCloned: false, alreadyCompleted: true };
  }

  const metricRepo = new SupabaseMetricConfigRepository(supabase, user.id);
  const save = new SaveMetricConfigUseCase(metricRepo);

  try {
    await new ApplyMetricTemplateUseCase(save).execute(user.id, templateId);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao aplicar métricas.",
    };
  }

  let demoCloned = false;
  const seedUserId = getDemoSeedUserIdForTemplate(templateId);
  const admin = getAdminClientOrNull();

  if (admin && seedUserId && user.id !== seedUserId) {
    try {
      const demoRepo = new SupabaseDemoTemplateRepository(admin);
      await demoRepo.cloneDemoFromTemplateUser(user.id, seedUserId);
      demoCloned = true;
    } catch (e) {
      console.error("[modality] Clone de demonstração falhou (métricas já aplicadas):", e);
    }
  }

  const { error: upsertErr } = await supabase.from("user_demo_state").upsert(
    {
      user_id: user.id,
      template_version: 1,
      applied_at: new Date().toISOString(),
      modality_chosen_at: new Date().toISOString(),
      modality_template_id: templateId,
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    return { ok: false, error: upsertErr.message };
  }

  try {
    await new InvalidateAnalysesUseCase({
      deleteAllForUser: async (uid: string) => {
        await supabase.from("ai_analyses").delete().eq("user_id", uid);
      },
    }).execute(user.id);
  } catch {
    // não bloquear
  }

  revalidatePath("/dashboard");
  return { ok: true, demoCloned };
}
