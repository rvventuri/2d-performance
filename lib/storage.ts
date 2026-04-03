import { createClient } from "@/lib/supabase/client";
import { Student, Assessment, Metrics, MetricConfig, TrainerProfile } from "./types";
import type {
  StudentRow,
  AssessmentRow,
  CustomMetricValueRow,
  AiAnalysisRow,
  TrainerProfileRow,
  MetricConfigRow,
} from "./supabase/database.types";

export type AiAnalysisStatus = 'pending' | 'running' | 'done' | 'error';

export interface AiAnalysis {
  id: string;
  studentId: string;
  content: string;
  lastAssessmentId: string | null;
  generatedAt: string;
  status: AiAnalysisStatus;
}

/** PostgREST: tabela não exposta / não existe no projeto — rode SCHEMA.sql no SQL Editor do Supabase. */
const MSG_DB_NOT_SETUP =
  "Banco não configurado: no Supabase, abra SQL Editor e execute o arquivo SCHEMA.sql (cria public.students e public.assessments).";

export function normalizeSupabaseError(error: unknown): Error {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "PGRST205") {
      return new Error(MSG_DB_NOT_SETUP);
    }
  }
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function isNoRowError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST116" ||
    (error.message?.toLowerCase().includes("row") &&
      error.message?.includes("0"))
  );
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

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
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    metrics,
  };
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

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(rowToStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (isNoRowError(error)) return null;
    throw normalizeSupabaseError(error);
  }
  return rowToStudent(data);
}

export async function createStudent(
  data: Omit<Student, "id" | "createdAt">
): Promise<Student> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: row, error } = await supabase
    .from("students")
    .insert({
      user_id: user.id,
      name: data.name,
      age: data.age || null,
      weight: data.weight || null,
      height: data.height || null,
      objective: data.objective || null,
      photo_url: data.photoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw normalizeSupabaseError(error);
  return rowToStudent(row);
}

export async function updateStudent(
  id: string,
  data: Partial<Omit<Student, "id" | "createdAt">>
): Promise<Student | null> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("students")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.age !== undefined && { age: data.age || null }),
      ...(data.weight !== undefined && { weight: data.weight || null }),
      ...(data.height !== undefined && { height: data.height || null }),
      ...(data.objective !== undefined && { objective: data.objective || null }),
      ...("photoUrl" in data && { photo_url: data.photoUrl ?? null }),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw normalizeSupabaseError(error);
  return rowToStudent(row);
}

export async function uploadAthletePhoto(
  studentId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${studentId}/photo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("athlete-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`);

  const { data } = supabase.storage.from("athlete-photos").getPublicUrl(path);
  // Cache-bust para forçar reload quando a foto é trocada
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteAthletePhoto(studentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Remove todos os arquivos do diretório do atleta (independente da extensão)
  const { data: files } = await supabase.storage
    .from("athlete-photos")
    .list(`${user.id}/${studentId}`);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${studentId}/${f.name}`);
    await supabase.storage.from("athlete-photos").remove(paths);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = createClient();
  // Remove foto do storage antes de deletar o registro
  await deleteAthletePhoto(id).catch(() => {});
  // assessments deletadas em cascata pelo FK
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw normalizeSupabaseError(error);
}

// ─── Assessments ─────────────────────────────────────────────────────────────

export async function getStudentAssessments(
  studentId: string
): Promise<Assessment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: true });
  if (error) throw normalizeSupabaseError(error);

  const assessments = (data ?? []).map(rowToAssessment);
  if (assessments.length === 0) return assessments;

  // Join custom metric values
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

  return assessments.map((a) => ({
    ...a,
    customMetrics: cvByAssessment[a.id] ?? {},
  }));
}

export async function saveCustomMetricValues(
  assessmentId: string,
  values: Record<string, number | null>
): Promise<void> {
  if (Object.keys(values).length === 0) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const rows = Object.entries(values).map(([metricKey, value]) => ({
    assessment_id: assessmentId,
    user_id: user.id,
    metric_key: metricKey,
    value,
  }));

  const { error } = await supabase
    .from("custom_metric_values")
    .upsert(rows, { onConflict: "assessment_id,metric_key" });
  if (error) throw normalizeSupabaseError(error);
}

export async function createAssessment(
  data: Omit<Assessment, "id">
): Promise<Assessment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: row, error } = await supabase
    .from("assessments")
    .insert({
      student_id: data.studentId,
      user_id: user.id,
      date: data.date,
      ...metricsToRow(data.metrics),
    })
    .select()
    .single();
  if (error) throw normalizeSupabaseError(error);
  return rowToAssessment(row);
}

export async function deleteAssessment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) throw normalizeSupabaseError(error);
}

// ─── AI Analyses ──────────────────────────────────────────────────────────────

export async function getAiAnalysis(studentId: string): Promise<AiAnalysis | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("student_id", studentId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();
  if (error) {
    if (isNoRowError(error)) return null;
    throw normalizeSupabaseError(error);
  }
  const row = data as AiAnalysisRow;
  return {
    id: row.id,
    studentId: row.student_id,
    content: row.content,
    lastAssessmentId: row.last_assessment_id ?? null,
    generatedAt: row.generated_at,
    status: (row.status ?? 'done') as AiAnalysisStatus,
  };
}

export async function saveAiAnalysis(
  studentId: string,
  content: string,
  lastAssessmentId: string | null,
  status: AiAnalysisStatus = 'done'
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Remove análise anterior e insere a nova (uma por atleta)
  await supabase.from("ai_analyses").delete().eq("student_id", studentId);

  const { error } = await supabase.from("ai_analyses").insert({
    student_id: studentId,
    user_id: user.id,
    content,
    last_assessment_id: lastAssessmentId,
    status,
  });
  if (error) throw normalizeSupabaseError(error);
}

export async function createPendingAnalysis(
  studentId: string,
  lastAssessmentId: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await supabase.from("ai_analyses").delete().eq("student_id", studentId);

  const { error } = await supabase.from("ai_analyses").insert({
    student_id: studentId,
    user_id: user.id,
    content: "{}",
    last_assessment_id: lastAssessmentId,
    status: "pending",
  });
  if (error) throw normalizeSupabaseError(error);
}

// ─── Trainer Config (client-side) ────────────────────────────────────────────

export async function getTrainerProfile(): Promise<TrainerProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error) {
    if (isNoRowError(error)) return null;
    return null;
  }
  const row = data as TrainerProfileRow;
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

export async function getMetricConfigs(): Promise<MetricConfig[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("metric_configs")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => {
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
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
