import { createClient } from "@/lib/supabase/client";
import { Student, Assessment, Metrics } from "./types";

export interface AiAnalysis {
  id: string;
  studentId: string;
  content: string;
  lastAssessmentId: string | null;
  generatedAt: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? 0,
    weight: row.weight ?? 0,
    height: row.height ?? 0,
    objective: row.objective ?? "",
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAssessment(row: any): Assessment {
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
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw normalizeSupabaseError(error);
  return rowToStudent(row);
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = createClient();
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
  return (data ?? []).map(rowToAssessment);
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
  return {
    id: data.id,
    studentId: data.student_id,
    content: data.content,
    lastAssessmentId: data.last_assessment_id ?? null,
    generatedAt: data.generated_at,
  };
}

export async function saveAiAnalysis(
  studentId: string,
  content: string,
  lastAssessmentId: string | null
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
  });
  if (error) throw normalizeSupabaseError(error);
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
