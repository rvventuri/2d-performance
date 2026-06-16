import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { AiAnalysisData } from "@/lib/types";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function rowToAssessment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    date: row.date as string,
    metrics: {
      cmj: toNumberOrNull(row.cmj),
      sj: toNumberOrNull(row.sj),
      abalakov: toNumberOrNull(row.abalakov),
      rsi: toNumberOrNull(row.rsi),
      tempoContato: toNumberOrNull(row.tempo_contato),
      alturaSaltoDJ: toNumberOrNull(row.altura_salto_dj),
      cmjEsquerdo: toNumberOrNull(row.cmj_esquerdo),
      cmjDireito: toNumberOrNull(row.cmj_direito),
      assimetriaPercentual: toNumberOrNull(row.assimetria_percentual),
      saltoHorizontal: toNumberOrNull(row.salto_horizontal),
    },
    customMetrics: {} as Record<string, number | null>,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = createAdminClient();

  // Busca o link pelo token
  const { data: link, error: linkError } = await admin
    .from("share_links")
    .select("id, student_id, user_id, password_hash")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
  }

  // Verificação de senha
  if (link.password_hash) {
    let body: { password?: string } = {};
    try {
      body = await request.json();
    } catch {
      // body vazio = sem senha fornecida
    }

    if (!body.password) {
      return NextResponse.json({ requiresPassword: true }, { status: 403 });
    }

    const valid = await bcrypt.compare(body.password, link.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }
  }

  // Busca dados do atleta
  const { data: studentRow, error: studentError } = await admin
    .from("students")
    .select("name, age, weight, height, objective, photo_url")
    .eq("id", link.student_id)
    .single();

  if (studentError || !studentRow) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  // Busca avaliações
  const { data: assessmentRows } = await admin
    .from("assessments")
    .select("*")
    .eq("student_id", link.student_id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  const assessments = (assessmentRows ?? []).map(rowToAssessment);

  // Join custom metric values
  if (assessments.length > 0) {
    const ids = assessments.map((a) => a.id);
    const { data: cvRows } = await admin
      .from("custom_metric_values")
      .select("*")
      .in("assessment_id", ids);

    const cvByAssessment: Record<string, Record<string, number | null>> = {};
    for (const cv of cvRows ?? []) {
      if (!cvByAssessment[cv.assessment_id]) cvByAssessment[cv.assessment_id] = {};
      cvByAssessment[cv.assessment_id][cv.metric_key] = toNumberOrNull(cv.value);
    }
    for (const a of assessments) {
      a.customMetrics = cvByAssessment[a.id] ?? {};
    }
  }

  // Busca labels de métricas customizadas do trainer
  const { data: metricConfigRows } = await admin
    .from("metric_configs")
    .select("metric_key, label")
    .eq("user_id", link.user_id);

  const customMetricLabels: Record<string, string> = {};
  for (const mc of metricConfigRows ?? []) {
    if (mc.metric_key && mc.label) customMetricLabels[mc.metric_key] = mc.label;
  }

  // Busca análise de IA
  const { data: aiRow } = await admin
    .from("ai_analyses")
    .select("content")
    .eq("student_id", link.student_id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  let aiAnalysis: AiAnalysisData | null = null;
  if (aiRow?.content) {
    try {
      aiAnalysis = JSON.parse(aiRow.content) as AiAnalysisData;
    } catch {
      aiAnalysis = null;
    }
  }

  return NextResponse.json({
    student: {
      name: studentRow.name,
      age: studentRow.age ?? 0,
      weight: toNumberOrNull(studentRow.weight) ?? 0,
      height: toNumberOrNull(studentRow.height) ?? 0,
      objective: studentRow.objective ?? "",
      photoUrl: studentRow.photo_url ?? null,
    },
    assessments,
    aiAnalysis,
    customMetricLabels,
  });
}
