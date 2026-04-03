/**
 * Shared AI analysis service.
 *
 * Centralises the Anthropic prompt builder and the API call so that both
 * the `/api/analyze-athlete` route and the `/api/seed` route share the exact
 * same logic without duplication.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Student, Assessment, ResolvedMetricConfig, AiAnalysisData } from "@/lib/types";
import {
  buildBenchmarkSection,
  buildWeightNote,
} from "@/domain/trainer/services/TrainerContextBuilder";

// Module-level client — instantiated lazily when first called so tests that
// don't set ANTHROPIC_API_KEY don't fail at import time.
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY não configurada. Adicione ao arquivo .env.local");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export function buildAnalysisPrompt(
  student: Student,
  assessments: Assessment[],
  metrics: ResolvedMetricConfig[],
  trainerContext: string
): string {
  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  const metricsMap: Record<string, ResolvedMetricConfig> = {};
  for (const m of metrics) metricsMap[m.key] = m;

  const formatMetricValue = (key: string, value: number | null) => {
    if (value === null) return null;
    const m = metricsMap[key];
    if (!m || !m.isEnabled) return null;
    return `  - ${m.label}: ${value}${m.unit}`;
  };

  const metricsLines = (assessment: Assessment) => {
    const defaultLines = Object.entries(assessment.metrics)
      .map(([k, v]) => formatMetricValue(k, v as number | null))
      .filter(Boolean);

    const customLines = Object.entries(assessment.customMetrics ?? {})
      .map(([k, v]) => formatMetricValue(k, v))
      .filter(Boolean);

    return [...defaultLines, ...customLines].join("\n");
  };

  const evolutionLines = () => {
    if (!previous) return "  (Primeira avaliação — sem comparativo anterior)";
    const allKeys = [
      ...Object.keys(latest.metrics),
      ...Object.keys(latest.customMetrics ?? {}),
    ];
    return allKeys
      .map((k) => {
        const currVal =
          (latest.metrics as unknown as Record<string, number | null>)[k] ??
          (latest.customMetrics ?? {})[k] ??
          null;
        const prevVal =
          (previous.metrics as unknown as Record<string, number | null>)[k] ??
          (previous.customMetrics ?? {})[k] ??
          null;
        if (currVal === null || prevVal === null) return null;
        const m = metricsMap[k];
        if (!m || !m.isEnabled) return null;
        const diff = currVal - prevVal;
        const pct = ((diff / Math.abs(prevVal)) * 100).toFixed(1);
        const sign = diff >= 0 ? "+" : "";
        return `  - ${m.label}: ${currVal}${m.unit} (${sign}${diff.toFixed(2)}${m.unit} / ${sign}${pct}%)`;
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
              [
                ...Object.entries(a.metrics),
                ...Object.entries(a.customMetrics ?? {}),
              ]
                .filter(([, v]) => v !== null)
                .map(([k, v]) => {
                  const m = metricsMap[k];
                  if (!m || !m.isEnabled) return null;
                  return `    ${m.label}: ${v}${m.unit}`;
                })
                .filter(Boolean)
                .join("\n")
          )
          .join("\n\n")
      : "";

  const objectiveContext = student.objective
    ? `OBJETIVO DO ATLETA: "${student.objective}"\nEste objetivo deve guiar toda a análise. Cada score, insight e prescrição deve ser diretamente conectado a ele.`
    : `OBJETIVO DO ATLETA: Não informado. Foque em performance geral e prevenção de lesões.`;

  const trainerSection = trainerContext
    ? `\n## Contexto do preparador físico\n\n${trainerContext}\n\nEste contexto deve guiar toda a análise, especialmente o foco prioritário e as prescrições.`
    : "";

  const benchmarkSection = buildBenchmarkSection(metrics);
  const weightNote = buildWeightNote(metrics);

  return `Você é um preparador físico de alto rendimento especializado em avaliação neuromuscular e biomecânica do salto.
${trainerSection}

${objectiveContext}

## Benchmarks de referência para cálculo dos scores

Use esses benchmarks para calcular os scores (0–100) e percentis de cada métrica:

${benchmarkSection}
${weightNote}

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
      "key": "<metric_key conforme configurado>",
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

export interface AnalysisResult {
  data: AiAnalysisData;
}

export async function runAnalysis(
  student: Student,
  assessments: Assessment[],
  metrics: ResolvedMetricConfig[],
  trainerContext: string
): Promise<AnalysisResult> {
  const anthropic = getClient();
  const prompt = buildAnalysisPrompt(student, assessments, metrics, trainerContext);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 7000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Resposta da IA não continha JSON válido. Tente novamente.");
  }

  const data = JSON.parse(raw.slice(start, end + 1)) as AiAnalysisData;
  return { data };
}
