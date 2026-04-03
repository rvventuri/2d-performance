import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Student, Assessment, Metrics, MetricConfig } from "@/lib/types";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import type { StudentRow, AssessmentRow, CustomMetricValueRow, MetricConfigRow } from "@/lib/supabase/database.types";
import StudentDetailClient from "./_components/StudentDetailClient";

function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? 0,
    weight: row.weight ?? 0,
    height: row.height ?? 0,
    objective: row.objective ?? "",
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at,
  };
}

function rowToAssessment(row: AssessmentRow): Assessment {
  const metrics: Metrics = {
    cmj: row.cmj,
    sj: row.sj,
    abalakov: row.abalakov,
    rsi: row.rsi,
    tempoContato: row.tempo_contato,
    alturaSaltoDJ: row.altura_salto_dj,
    cmjEsquerdo: row.cmj_esquerdo,
    cmjDireito: row.cmj_direito,
    assimetriaPercentual: row.assimetria_percentual,
    saltoHorizontal: row.salto_horizontal,
  };
  return { id: row.id, studentId: row.student_id, date: row.date, metrics };
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all data in parallel — 3 queries instead of N+1
  const [studentResult, assessmentsResult, metricConfigsResult] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("assessments").select("*").eq("student_id", id).order("date", { ascending: true }),
    supabase.from("metric_configs").select("*").eq("user_id", user.id).order("display_order", { ascending: true }),
  ]);

  if (studentResult.error || !studentResult.data) {
    notFound();
  }

  const student = rowToStudent(studentResult.data as StudentRow);
  const assessments = (assessmentsResult.data ?? []).map((r) => rowToAssessment(r as AssessmentRow));

  // Attach custom metrics in one batch query
  if (assessments.length > 0) {
    const ids = assessments.map((a) => a.id);
    const { data: cvRows } = await supabase
      .from("custom_metric_values")
      .select("*")
      .in("assessment_id", ids);

    const cvByAssessment: Record<string, Record<string, number | null>> = {};
    for (const cv of (cvRows ?? []) as CustomMetricValueRow[]) {
      if (!cvByAssessment[cv.assessment_id]) cvByAssessment[cv.assessment_id] = {};
      cvByAssessment[cv.assessment_id][cv.metric_key] = cv.value ?? null;
    }
    for (const a of assessments) {
      a.customMetrics = cvByAssessment[a.id] ?? {};
    }
  }

  const metricConfigs: MetricConfig[] = (metricConfigsResult.data ?? []).map((r) => {
    const row = r as MetricConfigRow;
    return {
      id: row.id,
      userId: row.user_id,
      metricKey: row.metric_key,
      label: row.label,
      unit: row.unit ?? "",
      higherIsBetter: row.higher_is_better,
      isCustom: row.is_custom,
      isEnabled: row.is_enabled,
      benchRecreational: row.bench_recreational ?? null,
      benchTrained: row.bench_trained ?? null,
      benchElite: row.bench_elite ?? null,
      weight: Number(row.weight),
      displayOrder: row.display_order ?? 0,
      createdAt: row.created_at,
    };
  });

  const initialResolvedMetrics = resolveMetricConfigs(metricConfigs);

  return (
    <StudentDetailClient
      id={id}
      initialStudent={student}
      initialAssessments={assessments}
      initialResolvedMetrics={initialResolvedMetrics}
    />
  );
}
