import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Student, Assessment, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { jsonrepair } from "jsonrepair";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(student: Student, assessments: Assessment[]): string {
  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  const formatMetric = (key: string, value: number | null) => {
    if (value === null) return null;
    const unit = METRIC_UNITS[key as keyof typeof METRIC_UNITS] || "";
    const label = METRIC_LABELS[key as keyof typeof METRIC_LABELS] || key;
    return `  - ${label}: ${value}${unit}`;
  };

  const metricsLines = (assessment: Assessment) =>
    Object.entries(assessment.metrics)
      .map(([k, v]) => formatMetric(k, v as number | null))
      .filter(Boolean)
      .join("\n");

  const evolutionLines = () => {
    if (!previous) return "  (Primeira avaliação — sem comparativo anterior)";
    return Object.entries(latest.metrics)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => {
        const prev = previous.metrics[k as keyof typeof previous.metrics];
        if (prev === null || prev === undefined) return null;
        const curr = v as number;
        const diff = curr - (prev as number);
        const pct = ((diff / Math.abs(prev as number)) * 100).toFixed(1);
        const unit = METRIC_UNITS[k as keyof typeof METRIC_UNITS] || "";
        const label = METRIC_LABELS[k as keyof typeof METRIC_LABELS] || k;
        const sign = diff >= 0 ? "+" : "";
        return `  - ${label}: ${curr}${unit} (${sign}${diff.toFixed(2)}${unit} / ${sign}${pct}%)`;
      })
      .filter(Boolean)
      .join("\n");
  };

  const historySection =
    assessments.length > 2
      ? `\nHISTÓRICO COMPLETO (${assessments.length} avaliações):\n` +
        assessments
          .map(
            (a, i) =>
              `  Avaliação ${i + 1} — ${a.date}:\n` +
              Object.entries(a.metrics)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => {
                  const unit = METRIC_UNITS[k as keyof typeof METRIC_UNITS] || "";
                  const label = METRIC_LABELS[k as keyof typeof METRIC_LABELS] || k;
                  return `    ${label}: ${v}${unit}`;
                })
                .join("\n")
          )
          .join("\n\n")
      : "";

  const objectiveContext = student.objective
    ? `OBJETIVO DO ATLETA: "${student.objective}"\nEste objetivo deve guiar toda a análise. Cada score, insight e prescrição deve ser diretamente conectado a ele.`
    : `OBJETIVO DO ATLETA: Não informado. Foque em performance geral e prevenção de lesões.`;

  return `Você é um preparador físico de alto rendimento especializado em avaliação neuromuscular e biomecânica do salto.

${objectiveContext}

## Benchmarks de referência para cálculo dos scores

Use esses benchmarks para calcular os scores (0–100) e percentis de cada métrica:

CMJ (cm, maior = melhor): Recreativo=30, Treinado=42, Elite=60, Classe Mundial=70
SJ (cm, maior = melhor): Recreativo=25, Treinado=38, Elite=55, Classe Mundial=65
Abalakov (cm, maior = melhor): Recreativo=34, Treinado=47, Elite=65, Classe Mundial=75
RSI (adimensional, maior = melhor): Recreativo=0.8, Treinado=1.5, Elite=2.5, Classe Mundial=3.0
Tempo de Contato (ms, MENOR = melhor): Recreativo=300, Treinado=230, Elite=170, Classe Mundial=140
Altura DJ (cm, maior = melhor): Recreativo=25, Treinado=35, Elite=48, Classe Mundial=55
Assimetria % (MENOR = melhor, risco >10%): Excelente=3, Treinado=7, Alerta=12, Crítico=20+
Salto Horizontal (cm, maior = melhor): Recreativo=175, Treinado=230, Elite=285, Classe Mundial=320

## Cálculo do score (0–100)
- 0–20: crítico (abaixo do recreativo)
- 20–40: em desenvolvimento (nível recreativo)
- 40–60: bom (entre recreativo e treinado)
- 60–75: avançado (nível treinado)
- 75–90: elite (entre treinado e classe mundial)
- 90–100: classe mundial

Para métricas "menor = melhor" (tempo de contato, assimetria): inverta o raciocínio.

## Dados do atleta

Nome: ${student.name}
Idade: ${student.age > 0 ? student.age + " anos" : "Não informada"}
Peso: ${student.weight > 0 ? student.weight + " kg" : "Não informado"}
Altura: ${student.height > 0 ? student.height + " cm" : "Não informada"}
Objetivo: ${student.objective || "Não informado"}
Total de avaliações: ${assessments.length}

AVALIAÇÃO MAIS RECENTE (${latest.date}):
${metricsLines(latest)}

${
  previous
    ? `AVALIAÇÃO ANTERIOR (${previous.date}):\n${metricsLines(previous)}\n\nEVOLUÇÃO (anterior → atual):\n${evolutionLines()}`
    : "PRIMEIRA AVALIAÇÃO — sem histórico anterior para comparação."
}
${historySection}

## Formato de resposta — JSON PURO

CRÍTICO: Responda APENAS com JSON válido e completo. Sem markdown, sem texto antes ou depois.
Mantenha os textos CURTOS (máx 1 frase por campo de texto) para garantir que o JSON caiba no limite de tokens.

{
  "performanceScore": <0–100>,
  "profileType": "<rótulo curto, máx 4 palavras>",
  "profileDescription": "<1 frase curta>",
  "summary": "<2 frases conectando métricas ao objetivo>",
  "objectiveAlignment": {
    "score": <0–100>,
    "keyGap": "<1 frase sobre o principal gap>",
    "timeline": "<estimativa de prazo>"
  },
  "metricScores": [
    {
      "key": "<cmj|sj|abalakov|rsi|tempoContato|alturaSaltoDJ|cmjEsquerdo|cmjDireito|assimetriaPercentual|saltoHorizontal>",
      "label": "<nome curto>",
      "value": <número>,
      "unit": "<unidade>",
      "score": <0–100>,
      "percentile": <0–100>,
      "status": "<elite|advanced|good|developing|critical>",
      "higherIsBetter": <true|false>,
      "benchmarks": { "recreational": <n>, "trained": <n>, "elite": <n> },
      "interpretation": "<1 frase técnica sobre o valor vs objetivo>"
    }
  ],
  "radarData": [
    { "metric": "<máx 10 chars>", "athlete": <0–100>, "trained": <55–65>, "elite": <80–88> }
  ],
  "strengths": [
    { "title": "<título curto>", "description": "<1 frase>", "metric": "<key opcional>" }
  ],
  "alerts": [
    { "priority": "<high|medium|low>", "title": "<título curto>", "description": "<1 frase>" }
  ],
  "evolution": ${
    assessments.length > 1
      ? `{ "trend": "<improving|stable|declining>", "highlight": "<frase curta de destaque>", "details": "<1 frase>", "keyMetrics": [{ "label": "<nome>", "change": <pct>, "direction": "<up|down|flat>" }] }`
      : "null"
  },
  "prescriptions": [
    {
      "priority": <1|2|3>,
      "quality": "<qualidade física>",
      "title": "<nome do método>",
      "rationale": "<1 frase conectando ao objetivo>",
      "examples": ["<ex1>", "<ex2>", "<ex3>"],
      "frequency": "<frequência semanal>"
    }
  ]
}

Inclua apenas métricas com dados disponíveis. Máximo 3 strengths, 3 alerts, 4 prescriptions, 5 radarData, 5 keyMetrics.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const prompt = buildPrompt(student, assessments);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 7000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Anthropic.AuthenticationError
            ? "Chave de API inválida. Verifique ANTHROPIC_API_KEY no .env.local"
            : err instanceof Anthropic.RateLimitError
            ? "Limite de requisições atingido. Tente novamente em alguns segundos."
            : err instanceof Error
            ? err.message
            : "Erro desconhecido ao chamar a API";
        controller.enqueue(encoder.encode(`__ERROR__:${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
