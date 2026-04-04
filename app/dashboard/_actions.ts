"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClientOrNull } from "@/lib/supabase/admin";
import { ClearDemoDataUseCase } from "@/application/demo/ClearDemoDataUseCase";
import { SupabaseDemoTemplateRepository } from "@/infrastructure/supabase/DemoTemplateRepository";

export type ClearDemoActionState = { ok: true; deletedStudents: number } | { ok: false; error: string };

export async function clearDemoDataAction(): Promise<ClearDemoActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autorizado." };
  }

  const admin = getAdminClientOrNull();
  const repo = admin ? new SupabaseDemoTemplateRepository(admin) : null;
  const useCase = new ClearDemoDataUseCase(repo);

  try {
    const { deletedStudents } = await useCase.execute(user.id);
    revalidatePath("/dashboard");
    return { ok: true, deletedStudents };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao limpar demonstração.";
    return { ok: false, error: message };
  }
}
