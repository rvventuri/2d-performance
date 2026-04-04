"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Metrics } from "@/lib/types";
import { GetTrainerConfigUseCase } from "@/application/trainer/GetTrainerConfigUseCase";
import { SupabaseTrainerProfileRepository } from "@/infrastructure/supabase/TrainerProfileRepository";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import { runAnalysis } from "@/lib/services/ai-analysis.service";

export interface CreateAssessmentInput {
  studentId: string;
  date: string;
  metrics: Metrics;
  customMetrics: Record<string, number | null>;
}

function metricsToRow(metrics: Metrics) {
  return {
    cmj: metrics.cmj,
    sj: metrics.sj,
    abalakov: metrics.abalakov,
    rsi: metrics.rsi,
    tempo_contato: metrics.tempoContato,
    altura_salto_dj: metrics.alturaSaltoDJ,
    cmj_esquerdo: metrics.cmjEsquerdo,
    cmj_direito: metrics.cmjDireito,
    assimetria_percentual: metrics.assimetriaPercentual,
    salto_horizontal: metrics.saltoHorizontal,
  };
}

function rowToStudent(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    age: (row.age as number) ?? 0,
    weight: (row.weight as number) ?? 0,
    height: (row.height as number) ?? 0,
    objective: (row.objective as string) ?? "",
    photoUrl: (row.photo_url as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToAssessment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    date: row.date as string,
    metrics: {
      cmj: row.cmj as number | null,
      sj: row.sj as number | null,
      abalakov: row.abalakov as number | null,
      rsi: row.rsi as number | null,
      tempoContato: row.tempo_contato as number | null,
      alturaSaltoDJ: row.altura_salto_dj as number | null,
      cmjEsquerdo: row.cmj_esquerdo as number | null,
      cmjDireito: row.cmj_direito as number | null,
      assimetriaPercentual: row.assimetria_percentual as number | null,
      saltoHorizontal: row.salto_horizontal as number | null,
    },
  };
}

async function runBackgroundAnalysis(
  studentId: string,
  userId: string,
  accessToken: string
) {
  // Create a Supabase client authenticated with the user's JWT
  // (no cookies available after the response is sent)
  const userClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  try {
    // Mark as running
    await userClient
      .from("ai_analyses")
      .update({ status: "running" })
      .eq("student_id", studentId)
      .eq("user_id", userId);

    // Load student
    const { data: studentRow, error: studentError } = await userClient
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentError || !studentRow) throw new Error("Aluno não encontrado");

    const student = rowToStudent(studentRow as Record<string, unknown>);

    // Load assessments
    const { data: assessmentRows } = await userClient
      .from("assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: true });

    const assessments = (assessmentRows ?? []).map((r) =>
      rowToAssessment(r as Record<string, unknown>)
    );

    if (assessments.length === 0) throw new Error("Nenhuma avaliação encontrada");

    // Attach custom metric values
    const ids = assessments.map((a) => a.id);
    const { data: cvRows } = await userClient
      .from("custom_metric_values")
      .select("*")
      .in("assessment_id", ids);

    const cvByAssessment: Record<string, Record<string, number | null>> = {};
    for (const cv of cvRows ?? []) {
      if (!cvByAssessment[cv.assessment_id]) cvByAssessment[cv.assessment_id] = {};
      cvByAssessment[cv.assessment_id][cv.metric_key] = cv.value ?? null;
    }

    const assessmentsWithCustom = assessments.map((a) => ({
      ...a,
      customMetrics: cvByAssessment[a.id] ?? {},
    }));

    // Load trainer config and goals in parallel
    let resolvedMetrics: ReturnType<typeof resolveMetricConfigs>;
    let trainerContext: string;

    try {
      const useCase = new GetTrainerConfigUseCase(
        new SupabaseTrainerProfileRepository(userClient, userId),
        new SupabaseMetricConfigRepository(userClient, userId)
      );
      const config = await useCase.execute(userId);
      resolvedMetrics = config.resolvedMetrics;
      trainerContext = config.trainerContext;
    } catch {
      resolvedMetrics = resolveMetricConfigs([]);
      trainerContext = "";
    }

    const { data: goalRows } = await userClient
      .from("student_goals")
      .select("*")
      .eq("student_id", studentId)
      .eq("user_id", userId);

    const goals = (goalRows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      studentId: r.student_id as string,
      userId: r.user_id as string,
      metricKey: r.metric_key as string,
      targetValue: Number(r.target_value),
      targetDate: (r.target_date as string | null) ?? null,
      createdAt: r.created_at as string,
    }));

    // Run analysis
    const { data: analysisData, durationMs, inputTokens, outputTokens } = await runAnalysis(
      student,
      assessmentsWithCustom,
      resolvedMetrics,
      trainerContext,
      goals,
    );

    const latestAssessment = assessmentsWithCustom[assessmentsWithCustom.length - 1];

    // Save result
    await userClient.from("ai_analyses").delete().eq("student_id", studentId);
    await userClient.from("ai_analyses").insert({
      student_id: studentId,
      user_id: userId,
      content: JSON.stringify(analysisData),
      last_assessment_id: latestAssessment.id,
      status: "done",
      duration_ms: durationMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });
  } catch {
    // Mark as error so the UI can surface a retry button
    try {
      await userClient
        .from("ai_analyses")
        .update({ status: "error" })
        .eq("student_id", studentId)
        .eq("user_id", userId);
    } catch {
      // Best-effort — ignore secondary failures
    }
  }
}

export async function createAssessmentAction(
  input: CreateAssessmentInput
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Capture session token before the response is sent — needed inside after()
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? null;

  // 1. Save assessment
  const { data: assessmentRow, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      student_id: input.studentId,
      user_id: user.id,
      date: input.date,
      ...metricsToRow(input.metrics),
    })
    .select()
    .single();

  if (assessmentError) throw new Error(assessmentError.message);

  // 2. Save custom metric values
  const customEntries = Object.entries(input.customMetrics).filter(
    ([, v]) => v !== null
  );
  if (customEntries.length > 0) {
    const rows = customEntries.map(([key, value]) => ({
      assessment_id: assessmentRow.id,
      user_id: user.id,
      metric_key: key,
      value,
    }));
    await supabase
      .from("custom_metric_values")
      .upsert(rows, { onConflict: "assessment_id,metric_key" });
  }

  // 3. Mark analysis as pending so the tab shows a loading state immediately
  await supabase.from("ai_analyses").delete().eq("student_id", input.studentId);
  await supabase.from("ai_analyses").insert({
    student_id: input.studentId,
    user_id: user.id,
    content: "{}",
    last_assessment_id: assessmentRow.id,
    status: "pending",
  });

  const studentId = input.studentId;
  const userId = user.id;

  // 4. Run analysis in background — executes after the redirect is sent
  if (accessToken) {
    after(async () => {
      await runBackgroundAnalysis(studentId, userId, accessToken);
    });
  }

  redirect(`/students/${studentId}`);
}
