"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseGoalRepository } from "@/infrastructure/supabase/GoalRepository";
import { SaveGoalUseCase } from "@/application/goal/SaveGoalUseCase";
import { DeleteGoalUseCase } from "@/application/goal/DeleteGoalUseCase";

export async function saveGoalAction(
  studentId: string,
  metricKey: string,
  targetValue: number,
  targetDate?: string | null,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const repo = new SupabaseGoalRepository(supabase, user.id);
  const useCase = new SaveGoalUseCase(repo, user.id);
  await useCase.execute({ studentId, metricKey, targetValue, targetDate });

  revalidatePath(`/students/${studentId}`);
}

export async function deleteGoalAction(
  studentId: string,
  metricKey: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const repo = new SupabaseGoalRepository(supabase, user.id);
  const useCase = new DeleteGoalUseCase(repo);
  await useCase.execute(studentId, metricKey);

  revalidatePath(`/students/${studentId}`);
}
