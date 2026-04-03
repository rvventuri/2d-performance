import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Student, Assessment, ResolvedMetricConfig } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { GetTrainerConfigUseCase } from "@/application/trainer/GetTrainerConfigUseCase";
import { SupabaseTrainerProfileRepository } from "@/infrastructure/supabase/TrainerProfileRepository";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import { runAnalysis, streamAnalysis } from "@/lib/services/ai-analysis.service";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Primary auth: session cookie (browser-originated requests)
  let { data: { user } } = await supabase.auth.getUser();

  // Fallback auth: Bearer token (background server-side calls via after())
  if (!user) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      user = data.user;
    }
  }

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
  let studentId: string;
  let useStreaming = false;

  try {
    const body = await req.json();

    // stream:true is only valid for browser requests (not background server calls)
    useStreaming = body.stream === true && !body.studentId;

    if (body.studentId) {
      // Background mode: load data from DB (sent by the server action's after() callback)
      studentId = body.studentId as string;

      // Mark as running before querying (best-effort)
      await supabase
        .from("ai_analyses")
        .update({ status: "running" })
        .eq("student_id", studentId)
        .eq("user_id", user.id);

      const { data: studentRow, error: sErr } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .eq("user_id", user.id)
        .single();

      if (sErr || !studentRow) {
        return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
      }

      student = {
        id: studentRow.id,
        name: studentRow.name,
        age: studentRow.age ?? 0,
        weight: studentRow.weight ?? 0,
        height: studentRow.height ?? 0,
        objective: studentRow.objective ?? "",
        photoUrl: studentRow.photo_url ?? null,
        createdAt: studentRow.created_at,
      };

      const { data: aRows } = await supabase
        .from("assessments")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: true });

      const baseAssessments = (aRows ?? []).map((r) => ({
        id: r.id as string,
        studentId: r.student_id as string,
        date: r.date as string,
        metrics: {
          cmj: r.cmj as number | null,
          sj: r.sj as number | null,
          abalakov: r.abalakov as number | null,
          rsi: r.rsi as number | null,
          tempoContato: r.tempo_contato as number | null,
          alturaSaltoDJ: r.altura_salto_dj as number | null,
          cmjEsquerdo: r.cmj_esquerdo as number | null,
          cmjDireito: r.cmj_direito as number | null,
          assimetriaPercentual: r.assimetria_percentual as number | null,
          saltoHorizontal: r.salto_horizontal as number | null,
        },
      }));

      // Attach custom metric values
      if (baseAssessments.length > 0) {
        const ids = baseAssessments.map((a) => a.id);
        const { data: cvRows } = await supabase
          .from("custom_metric_values")
          .select("*")
          .in("assessment_id", ids);

        const cvMap: Record<string, Record<string, number | null>> = {};
        for (const cv of cvRows ?? []) {
          if (!cvMap[cv.assessment_id]) cvMap[cv.assessment_id] = {};
          cvMap[cv.assessment_id][cv.metric_key] = cv.value ?? null;
        }

        assessments = baseAssessments.map((a) => ({
          ...a,
          customMetrics: cvMap[a.id] ?? {},
        }));
      } else {
        assessments = baseAssessments;
      }
    } else {
      // Browser mode: full objects sent directly from the tab
      student = body.student as Student;
      assessments = body.assessments as Assessment[];
      studentId = student?.id;
    }
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

  // ── Streaming path (browser manual generate) ──────────────────────────────

  if (useStreaming) {
    const encoder = new TextEncoder();
    const latestAssessment = assessments[assessments.length - 1];
    const capturedStudentId = studentId;
    const capturedUserId = user.id;

    const readable = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };

        try {
          const gen = streamAnalysis(
            student,
            assessments,
            resolvedMetrics,
            trainerContext
          );

          // Iterate chunks from the generator
          while (true) {
            const next = await gen.next();

            if (next.done) {
              // next.value is AnalysisResult (the generator's return value)
              const { data: analysisData, durationMs, inputTokens, outputTokens } = next.value;

              // Persist to DB
              await supabase
                .from("ai_analyses")
                .delete()
                .eq("student_id", capturedStudentId);
              await supabase.from("ai_analyses").insert({
                student_id: capturedStudentId,
                user_id: capturedUserId,
                content: JSON.stringify(analysisData),
                last_assessment_id: latestAssessment?.id ?? null,
                status: "done",
                duration_ms: durationMs,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
              });

              send({ done: true, data: analysisData });
              controller.close();
              break;
            }

            // Yield text chunk to browser
            send({ text: next.value as string });
          }
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

          send({ error: message });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── Non-streaming path (background server calls) ───────────────────────────

  try {
    const { data, durationMs, inputTokens, outputTokens } = await runAnalysis(student, assessments, resolvedMetrics, trainerContext);

    // Persist result with status 'done'
    const latestAssessment = assessments[assessments.length - 1];
    await supabase.from("ai_analyses").delete().eq("student_id", studentId);
    await supabase.from("ai_analyses").insert({
      student_id: studentId,
      user_id: user.id,
      content: JSON.stringify(data),
      last_assessment_id: latestAssessment?.id ?? null,
      status: "done",
      duration_ms: durationMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });

    return NextResponse.json(data);
  } catch (err) {
    // Mark as error so the UI can surface a retry button
    try {
      await supabase
        .from("ai_analyses")
        .update({ status: "error" })
        .eq("student_id", studentId)
        .eq("user_id", user.id);
    } catch {
      // Best-effort status update — ignore secondary failures
    }

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
