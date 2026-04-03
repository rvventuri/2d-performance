import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Student, Assessment, ResolvedMetricConfig } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { GetTrainerConfigUseCase } from "@/application/trainer/GetTrainerConfigUseCase";
import { SupabaseTrainerProfileRepository } from "@/infrastructure/supabase/TrainerProfileRepository";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import { runAnalysis } from "@/lib/services/ai-analysis.service";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada. Adicione ao arquivo .env.local" },
      { status: 500 }
    );
  }

  let student: Student;
  let assessments: Assessment[];

  try {
    const body = await req.json();
    student = body.student;
    assessments = body.assessments;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!student || !assessments || assessments.length === 0) {
    return NextResponse.json(
      { error: "Dados insuficientes. Registre pelo menos uma avaliação." },
      { status: 400 }
    );
  }

  // Load trainer config (fail-safe: falls back to defaults if anything throws)
  let resolvedMetrics: ResolvedMetricConfig[];
  let trainerContext: string;

  try {
    const useCase = new GetTrainerConfigUseCase(
      new SupabaseTrainerProfileRepository(supabase, user.id),
      new SupabaseMetricConfigRepository(supabase, user.id)
    );
    const config = await useCase.execute(user.id);
    resolvedMetrics = config.resolvedMetrics;
    trainerContext = config.trainerContext;
  } catch {
    resolvedMetrics = resolveMetricConfigs([]);
    trainerContext = "";
  }

  try {
    const { data } = await runAnalysis(student, assessments, resolvedMetrics, trainerContext);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Anthropic.AuthenticationError
        ? "Chave de API inválida. Verifique ANTHROPIC_API_KEY no .env.local"
        : err instanceof Anthropic.RateLimitError
        ? "Limite de requisições atingido. Tente novamente em alguns segundos."
        : err instanceof SyntaxError
        ? "Resposta da IA veio malformada. Tente novamente."
        : err instanceof Error
        ? err.message
        : "Erro desconhecido ao chamar a API";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
