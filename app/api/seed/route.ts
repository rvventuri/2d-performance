import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Student, Assessment, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";

export const maxDuration = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asym(left: number, right: number) {
  const max = Math.max(left, right);
  return parseFloat(((Math.abs(left - right) / max) * 100).toFixed(2));
}

function round(n: number, decimals = 2) {
  return parseFloat(n.toFixed(decimals));
}

// ─── Dados dos atletas ────────────────────────────────────────────────────────
//
// Perfis: futebol (atacante, meia em retorno de lesão, zagueiro × 2) +
//         futvolei (profissional e semi-profissional) + atacante ponta
//
// Referências biomecânicas utilizadas:
//   • Futebol profissional BR: CMJ 38-58 cm, RSI 1.2-1.9, TC 230-350 ms
//   • Futvolei profissional:   CMJ 55-70 cm, RSI 1.9-2.7, TC 180-230 ms
//   • Assimetria aceitável: < 10 %; > 15 % indica risco clínico

const ATHLETES = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. FUTEBOL · Atacante — velocidade, 1º passo e explosão ofensiva
  //    Perfil: jovem, assimetria leve (entorse histórica no tornozelo E),
  //    ciclo elástico bom, evolução consistente durante a pré-temporada.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Mateus Assis",
    age: 21,
    weight: 74.0,
    height: 176.0,
    objective:
      "Desenvolver aceleração e explosão no primeiro passo para consolidar posição de titular no ataque — meta RSI > 1,80 e salto horizontal > 245 cm até o final da temporada",
    assessments: [
      {
        date: "2024-09-03",
        cmj: 38.6,
        sj: 32.1,
        abalakov: 44.8,
        rsi: 1.38,
        tempoContato: 276,
        alturaSaltoDJ: 38.0,
        cmjEsquerdo: 34.2,
        cmjDireito: 41.8,
        saltoHorizontal: 228.0,
      },
      {
        date: "2024-10-08",
        cmj: 39.9,
        sj: 33.0,
        abalakov: 46.2,
        rsi: 1.46,
        tempoContato: 268,
        alturaSaltoDJ: 38.8,
        cmjEsquerdo: 35.6,
        cmjDireito: 43.1,
        saltoHorizontal: 232.5,
      },
      {
        date: "2024-11-12",
        cmj: 41.4,
        sj: 33.9,
        abalakov: 47.6,
        rsi: 1.54,
        tempoContato: 258,
        alturaSaltoDJ: 39.8,
        cmjEsquerdo: 37.4,
        cmjDireito: 44.5,
        saltoHorizontal: 236.0,
      },
      // pequena queda no retorno pós-férias de verão
      {
        date: "2025-01-07",
        cmj: 40.2,
        sj: 33.4,
        abalakov: 46.8,
        rsi: 1.48,
        tempoContato: 264,
        alturaSaltoDJ: 39.0,
        cmjEsquerdo: 36.6,
        cmjDireito: 43.4,
        saltoHorizontal: 233.5,
      },
      {
        date: "2025-02-11",
        cmj: 43.1,
        sj: 35.2,
        abalakov: 49.4,
        rsi: 1.62,
        tempoContato: 248,
        alturaSaltoDJ: 40.8,
        cmjEsquerdo: 39.2,
        cmjDireito: 46.2,
        saltoHorizontal: 241.0,
      },
      {
        date: "2025-03-18",
        cmj: 44.8,
        sj: 36.6,
        abalakov: 51.2,
        rsi: 1.74,
        tempoContato: 239,
        alturaSaltoDJ: 41.6,
        cmjEsquerdo: 40.8,
        cmjDireito: 47.8,
        saltoHorizontal: 246.5,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. FUTEBOL · Meia-campo — retorno pós-lesão muscular
  //    Perfil: distensão grau II na coxa D há 4 meses; retorno gradual.
  //    Alta assimetria no início (~33 %), reduzindo para ~5 % ao longo do
  //    acompanhamento. RSI e TC bem comprometidos no início.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Gabriel Monteiro",
    age: 25,
    weight: 78.0,
    height: 180.0,
    objective:
      "Retorno completo após distensão grau II na coxa direita — restaurar simetria bilateral, atingir RSI > 1,40 e retomar volume tático integral até abril",
    assessments: [
      // 1ª avaliação: 4 meses após lesão — membro D ainda bem defasado
      {
        date: "2024-09-16",
        cmj: 31.2,
        sj: 28.4,
        abalakov: 37.6,
        rsi: 0.82,
        tempoContato: 358,
        alturaSaltoDJ: 27.8,
        cmjEsquerdo: 36.4,
        cmjDireito: 24.2,
        saltoHorizontal: 192.0,
      },
      {
        date: "2024-10-21",
        cmj: 34.1,
        sj: 30.8,
        abalakov: 40.5,
        rsi: 0.94,
        tempoContato: 340,
        alturaSaltoDJ: 30.5,
        cmjEsquerdo: 38.2,
        cmjDireito: 28.6,
        saltoHorizontal: 200.5,
      },
      {
        date: "2024-11-26",
        cmj: 37.6,
        sj: 33.2,
        abalakov: 43.8,
        rsi: 1.08,
        tempoContato: 318,
        alturaSaltoDJ: 33.1,
        cmjEsquerdo: 40.4,
        cmjDireito: 33.2,
        saltoHorizontal: 210.0,
      },
      {
        date: "2025-01-14",
        cmj: 39.8,
        sj: 34.9,
        abalakov: 46.2,
        rsi: 1.22,
        tempoContato: 298,
        alturaSaltoDJ: 35.6,
        cmjEsquerdo: 41.6,
        cmjDireito: 37.2,
        saltoHorizontal: 218.5,
      },
      // desfecho: assimetria já dentro do limite seguro (~5 %)
      {
        date: "2025-02-18",
        cmj: 42.1,
        sj: 36.4,
        abalakov: 48.6,
        rsi: 1.38,
        tempoContato: 276,
        alturaSaltoDJ: 37.8,
        cmjEsquerdo: 42.8,
        cmjDireito: 40.6,
        saltoHorizontal: 226.0,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. FUTEBOL · Zagueiro veterano — força, explosão e duelos aéreos
  //    Perfil: atleta pesado, CMJ elevado pela força concêntrica, RSI limitado
  //    pelo peso corporal, tempo de contato alto. Foco: reatividade e salto.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Vitor Hugo Santos",
    age: 27,
    weight: 91.0,
    height: 188.0,
    objective:
      "Aumentar reatividade e reduzir tempo de contato no Drop Jump para dominar duelos aéreos e atuar na pressão alta — meta RSI > 1,60 até outubro",
    assessments: [
      {
        date: "2024-09-02",
        cmj: 48.4,
        sj: 44.2,
        abalakov: 55.6,
        rsi: 1.14,
        tempoContato: 338,
        alturaSaltoDJ: 38.5,
        cmjEsquerdo: 46.8,
        cmjDireito: 49.2,
        saltoHorizontal: 242.0,
      },
      {
        date: "2024-10-07",
        cmj: 50.1,
        sj: 45.4,
        abalakov: 57.2,
        rsi: 1.22,
        tempoContato: 326,
        alturaSaltoDJ: 39.8,
        cmjEsquerdo: 48.4,
        cmjDireito: 51.0,
        saltoHorizontal: 246.5,
      },
      {
        date: "2024-11-11",
        cmj: 51.8,
        sj: 46.6,
        abalakov: 58.9,
        rsi: 1.31,
        tempoContato: 312,
        alturaSaltoDJ: 40.9,
        cmjEsquerdo: 50.2,
        cmjDireito: 53.1,
        saltoHorizontal: 250.5,
      },
      {
        date: "2025-01-06",
        cmj: 53.4,
        sj: 47.8,
        abalakov: 60.6,
        rsi: 1.40,
        tempoContato: 299,
        alturaSaltoDJ: 42.1,
        cmjEsquerdo: 51.8,
        cmjDireito: 54.8,
        saltoHorizontal: 254.0,
      },
      {
        date: "2025-02-10",
        cmj: 55.2,
        sj: 49.1,
        abalakov: 62.5,
        rsi: 1.48,
        tempoContato: 285,
        alturaSaltoDJ: 43.4,
        cmjEsquerdo: 53.6,
        cmjDireito: 56.2,
        saltoHorizontal: 258.5,
      },
      {
        date: "2025-03-17",
        cmj: 56.8,
        sj: 50.3,
        abalakov: 64.2,
        rsi: 1.56,
        tempoContato: 274,
        alturaSaltoDJ: 44.5,
        cmjEsquerdo: 55.0,
        cmjDireito: 58.1,
        saltoHorizontal: 262.0,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. FUTEBOL · Zagueiro jovem — categoria sub-20
  //    Perfil: fisicamente em desenvolvimento, boa relação SJ/CMJ indicando
  //    força concêntrica adequada, mas ciclo elástico ainda imaturo.
  //    Sem histórico de lesão, evolução linear esperada.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Kauan Ferreira",
    age: 17,
    weight: 82.0,
    height: 184.0,
    objective:
      "Atingir CMJ > 50 cm e reduzir assimetria para < 6 % até o final da temporada sub-20 — base para disputa de vaga no profissional em 2026",
    assessments: [
      {
        date: "2024-10-14",
        cmj: 40.8,
        sj: 38.2,
        abalakov: 48.4,
        rsi: 1.18,
        tempoContato: 322,
        alturaSaltoDJ: 37.2,
        cmjEsquerdo: 39.6,
        cmjDireito: 42.8,
        saltoHorizontal: 234.0,
      },
      {
        date: "2024-11-18",
        cmj: 42.6,
        sj: 39.8,
        abalakov: 50.1,
        rsi: 1.28,
        tempoContato: 308,
        alturaSaltoDJ: 38.6,
        cmjEsquerdo: 41.4,
        cmjDireito: 43.8,
        saltoHorizontal: 239.0,
      },
      {
        date: "2025-01-13",
        cmj: 44.4,
        sj: 41.2,
        abalakov: 52.0,
        rsi: 1.36,
        tempoContato: 294,
        alturaSaltoDJ: 40.1,
        cmjEsquerdo: 43.2,
        cmjDireito: 45.6,
        saltoHorizontal: 244.5,
      },
      {
        date: "2025-02-17",
        cmj: 46.1,
        sj: 42.6,
        abalakov: 53.8,
        rsi: 1.46,
        tempoContato: 281,
        alturaSaltoDJ: 41.4,
        cmjEsquerdo: 45.0,
        cmjDireito: 47.2,
        saltoHorizontal: 249.0,
      },
      {
        date: "2025-03-24",
        cmj: 47.8,
        sj: 44.0,
        abalakov: 55.6,
        rsi: 1.54,
        tempoContato: 268,
        alturaSaltoDJ: 42.6,
        cmjEsquerdo: 46.8,
        cmjDireito: 49.0,
        saltoHorizontal: 254.0,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. FUTEBOL · Atacante ponta/extremo — velocidade máxima e reatividade
  //    Perfil: muito leve, ciclo elástico excepcional (SSC eficiente),
  //    SJ bem abaixo do CMJ indicando alta dependência do reflexo de
  //    estiramento. Assimetria quase nula. Foco: RSI cada vez mais alto.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Bruno Lacerda",
    age: 23,
    weight: 71.0,
    height: 172.0,
    objective:
      "Elevar RSI acima de 2,20 e manter tempo de contato abaixo de 200 ms para maximizar velocidade de sprint e eficiência nas mudanças de direção",
    assessments: [
      {
        date: "2024-09-10",
        cmj: 42.8,
        sj: 34.6,
        abalakov: 49.2,
        rsi: 1.76,
        tempoContato: 246,
        alturaSaltoDJ: 43.2,
        cmjEsquerdo: 41.6,
        cmjDireito: 43.8,
        saltoHorizontal: 247.5,
      },
      {
        date: "2024-10-15",
        cmj: 44.2,
        sj: 35.4,
        abalakov: 50.8,
        rsi: 1.84,
        tempoContato: 238,
        alturaSaltoDJ: 43.8,
        cmjEsquerdo: 43.0,
        cmjDireito: 45.2,
        saltoHorizontal: 251.5,
      },
      {
        date: "2024-11-19",
        cmj: 45.8,
        sj: 36.4,
        abalakov: 52.4,
        rsi: 1.96,
        tempoContato: 228,
        alturaSaltoDJ: 44.7,
        cmjEsquerdo: 44.6,
        cmjDireito: 46.8,
        saltoHorizontal: 256.0,
      },
      {
        date: "2025-01-14",
        cmj: 47.2,
        sj: 37.4,
        abalakov: 54.0,
        rsi: 2.04,
        tempoContato: 219,
        alturaSaltoDJ: 44.4,
        cmjEsquerdo: 46.0,
        cmjDireito: 48.2,
        saltoHorizontal: 260.5,
      },
      {
        date: "2025-02-18",
        cmj: 48.6,
        sj: 38.4,
        abalakov: 55.6,
        rsi: 2.14,
        tempoContato: 210,
        alturaSaltoDJ: 44.8,
        cmjEsquerdo: 47.4,
        cmjDireito: 49.8,
        saltoHorizontal: 265.0,
      },
      {
        date: "2025-03-25",
        cmj: 50.1,
        sj: 39.6,
        abalakov: 57.2,
        rsi: 2.24,
        tempoContato: 201,
        alturaSaltoDJ: 45.2,
        cmjEsquerdo: 48.8,
        cmjDireito: 51.2,
        saltoHorizontal: 270.0,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. FUTVOLEI · Jogador profissional — salto excepcional e reatividade
  //    Perfil: alto padrão de CMJ e Abalakov (braços muito ativos no salto),
  //    RSI elevado, tempo de contato baixo-médio. Assimetria mínima.
  //    Objetivo: circuito nacional — manter e elevar pico de performance.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Thiago Duarte",
    age: 28,
    weight: 80.0,
    height: 182.0,
    objective:
      "Manter nível de elite e elevar altura de ataque acima de 3,10 m — consolidar posição no Top 5 do ranking nacional de futvolei dupla na temporada 2025",
    assessments: [
      {
        date: "2024-08-26",
        cmj: 56.2,
        sj: 47.4,
        abalakov: 64.8,
        rsi: 1.92,
        tempoContato: 228,
        alturaSaltoDJ: 43.8,
        cmjEsquerdo: 54.8,
        cmjDireito: 57.2,
        saltoHorizontal: 270.0,
      },
      {
        date: "2024-10-01",
        cmj: 57.8,
        sj: 48.6,
        abalakov: 66.4,
        rsi: 2.04,
        tempoContato: 219,
        alturaSaltoDJ: 44.7,
        cmjEsquerdo: 56.2,
        cmjDireito: 58.8,
        saltoHorizontal: 274.5,
      },
      {
        date: "2024-11-05",
        cmj: 59.4,
        sj: 49.8,
        abalakov: 68.1,
        rsi: 2.18,
        tempoContato: 210,
        alturaSaltoDJ: 45.8,
        cmjEsquerdo: 57.8,
        cmjDireito: 60.4,
        saltoHorizontal: 279.0,
      },
      {
        date: "2025-01-07",
        cmj: 61.0,
        sj: 51.2,
        abalakov: 69.8,
        rsi: 2.32,
        tempoContato: 201,
        alturaSaltoDJ: 46.8,
        cmjEsquerdo: 59.4,
        cmjDireito: 62.1,
        saltoHorizontal: 283.5,
      },
      {
        date: "2025-02-11",
        cmj: 62.6,
        sj: 52.4,
        abalakov: 71.4,
        rsi: 2.46,
        tempoContato: 192,
        alturaSaltoDJ: 47.9,
        cmjEsquerdo: 61.0,
        cmjDireito: 63.8,
        saltoHorizontal: 288.0,
      },
      {
        date: "2025-03-18",
        cmj: 64.1,
        sj: 53.6,
        abalakov: 73.0,
        rsi: 2.58,
        tempoContato: 184,
        alturaSaltoDJ: 48.8,
        cmjEsquerdo: 62.4,
        cmjDireito: 65.2,
        saltoHorizontal: 292.5,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. FUTVOLEI · Jogador semi-profissional — em evolução para o circuito
  //    Perfil: boa base, CMJ crescendo, assimetria moderada (10 → 5 %),
  //    ainda distante dos benchmarks profissionais mas com trajetória clara.
  //    Objetivo: qualificar para o circuito regional até o fim do ano.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Felipe Barros",
    age: 22,
    weight: 75.0,
    height: 178.0,
    objective:
      "Elevar CMJ para > 56 cm e RSI > 1,90 até dezembro para disputar a fase classificatória do Circuito Regional de Futvolei 2025",
    assessments: [
      {
        date: "2024-09-09",
        cmj: 43.2,
        sj: 36.4,
        abalakov: 50.8,
        rsi: 1.48,
        tempoContato: 262,
        alturaSaltoDJ: 38.8,
        cmjEsquerdo: 39.6,
        cmjDireito: 45.8,
        saltoHorizontal: 248.0,
      },
      {
        date: "2024-10-14",
        cmj: 45.0,
        sj: 37.6,
        abalakov: 52.4,
        rsi: 1.56,
        tempoContato: 254,
        alturaSaltoDJ: 39.8,
        cmjEsquerdo: 41.4,
        cmjDireito: 47.4,
        saltoHorizontal: 253.0,
      },
      {
        date: "2024-11-18",
        cmj: 46.8,
        sj: 38.8,
        abalakov: 54.2,
        rsi: 1.64,
        tempoContato: 246,
        alturaSaltoDJ: 40.8,
        cmjEsquerdo: 43.4,
        cmjDireito: 49.2,
        saltoHorizontal: 257.5,
      },
      {
        date: "2025-01-13",
        cmj: 48.6,
        sj: 40.2,
        abalakov: 56.0,
        rsi: 1.74,
        tempoContato: 236,
        alturaSaltoDJ: 41.8,
        cmjEsquerdo: 45.8,
        cmjDireito: 50.6,
        saltoHorizontal: 262.0,
      },
      {
        date: "2025-02-17",
        cmj: 50.4,
        sj: 41.6,
        abalakov: 57.8,
        rsi: 1.86,
        tempoContato: 226,
        alturaSaltoDJ: 42.8,
        cmjEsquerdo: 48.0,
        cmjDireito: 52.4,
        saltoHorizontal: 267.0,
      },
    ],
  },
];

// ─── AI helpers ───────────────────────────────────────────────────────────────

function buildAnalysisPrompt(student: Student, assessments: Assessment[]): string {
  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  const fmt = (key: string, value: number | null) => {
    if (value === null) return null;
    const unit = METRIC_UNITS[key as keyof typeof METRIC_UNITS] ?? "";
    const label = METRIC_LABELS[key as keyof typeof METRIC_LABELS] ?? key;
    return `  - ${label}: ${value}${unit}`;
  };

  const metricsLines = (a: Assessment) =>
    Object.entries(a.metrics)
      .map(([k, v]) => fmt(k, v as number | null))
      .filter(Boolean)
      .join("\n");

  const evolutionLines = () => {
    if (!previous) return "  (Primeira avaliação — sem comparativo anterior)";
    return Object.entries(latest.metrics)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => {
        const prev = previous.metrics[k as keyof typeof previous.metrics];
        if (prev == null) return null;
        const curr = v as number;
        const diff = curr - (prev as number);
        const pct = ((diff / Math.abs(prev as number)) * 100).toFixed(1);
        const unit = METRIC_UNITS[k as keyof typeof METRIC_UNITS] ?? "";
        const label = METRIC_LABELS[k as keyof typeof METRIC_LABELS] ?? k;
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
                  const unit = METRIC_UNITS[k as keyof typeof METRIC_UNITS] ?? "";
                  const label = METRIC_LABELS[k as keyof typeof METRIC_LABELS] ?? k;
                  return `    ${label}: ${v}${unit}`;
                })
                .join("\n")
          )
          .join("\n\n")
      : "";

  const objectiveCtx = student.objective
    ? `OBJETIVO DO ATLETA: "${student.objective}"\nEste objetivo deve guiar toda a análise.`
    : `OBJETIVO DO ATLETA: Não informado. Foque em performance geral e prevenção de lesões.`;

  return `Você é um preparador físico de alto rendimento especializado em avaliação neuromuscular e biomecânica do salto.

${objectiveCtx}

## Benchmarks de referência para cálculo dos scores

CMJ (cm, maior = melhor): Recreativo=30, Treinado=42, Elite=60, Classe Mundial=70
SJ (cm, maior = melhor): Recreativo=25, Treinado=38, Elite=55, Classe Mundial=65
Abalakov (cm, maior = melhor): Recreativo=34, Treinado=47, Elite=65, Classe Mundial=75
RSI (adimensional, maior = melhor): Recreativo=0.8, Treinado=1.5, Elite=2.5, Classe Mundial=3.0
Tempo de Contato (ms, MENOR = melhor): Recreativo=300, Treinado=230, Elite=170, Classe Mundial=140
Altura DJ (cm, maior = melhor): Recreativo=25, Treinado=35, Elite=48, Classe Mundial=55
Assimetria % (MENOR = melhor, risco >10%): Excelente=3, Treinado=7, Alerta=12, Crítico=20+
Salto Horizontal (cm, maior = melhor): Recreativo=175, Treinado=230, Elite=285, Classe Mundial=320

## Cálculo do score (0–100)
- 0–20: crítico | 20–40: em desenvolvimento | 40–60: bom | 60–75: avançado | 75–90: elite | 90–100: classe mundial
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
  "objectiveAlignment": { "score": <0–100>, "keyGap": "<1 frase>", "timeline": "<prazo estimado>" },
  "metricScores": [{ "key": "<key>", "label": "<nome>", "value": <n>, "unit": "<unidade>", "score": <0–100>, "percentile": <0–100>, "status": "<elite|advanced|good|developing|critical>", "higherIsBetter": <bool>, "benchmarks": { "recreational": <n>, "trained": <n>, "elite": <n> }, "interpretation": "<1 frase>" }],
  "radarData": [{ "metric": "<máx 10 chars>", "athlete": <0–100>, "trained": <55–65>, "elite": <80–88> }],
  "strengths": [{ "title": "<título>", "description": "<1 frase>", "metric": "<key opcional>" }],
  "alerts": [{ "priority": "<high|medium|low>", "title": "<título>", "description": "<1 frase>" }],
  "evolution": ${assessments.length > 1 ? `{ "trend": "<improving|stable|declining>", "highlight": "<frase>", "details": "<1 frase>", "keyMetrics": [{ "label": "<nome>", "change": <pct>, "direction": "<up|down|flat>" }] }` : "null"},
  "prescriptions": [{ "priority": <1|2|3>, "quality": "<qualidade>", "title": "<método>", "rationale": "<1 frase>", "examples": ["<ex1>","<ex2>","<ex3>"], "frequency": "<freq semanal>" }]
}

Inclua apenas métricas com dados disponíveis. Máximo 3 strengths, 3 alerts, 4 prescriptions, 5 radarData, 5 keyMetrics.`;
}

/** Chama Claude e retorna o JSON como string para persistir no banco. */
async function generateAnalysis(
  anthropic: Anthropic,
  student: Student,
  assessments: Assessment[]
): Promise<string> {
  const prompt = buildAnalysisPrompt(student, assessments);
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
  if (start === -1 || end === -1) throw new Error("JSON não encontrado na resposta da IA");

  // Validate parse before returning
  JSON.parse(raw.slice(start, end + 1));
  return raw.slice(start, end + 1);
}

/**
 * Executa um conjunto de tarefas assíncronas com no máximo `limit` em paralelo.
 * Retorna um array de PromiseSettledResult na mesma ordem das tarefas.
 */
async function pooled<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  const queue = [...tasks.entries()]; // [index, taskFn]

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      const [i, task] = next;
      try {
        results[i] = { status: "fulfilled", value: await task() };
      } catch (err) {
        results[i] = { status: "rejected", reason: err };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // ── 1. Limpa dados anteriores do usuário (FK order: analyses → assessments → students) ──
    await supabase.from("ai_analyses").delete().eq("user_id", user.id);
    await supabase.from("assessments").delete().eq("user_id", user.id);
    await supabase.from("students").delete().eq("user_id", user.id);

    // Acumula os dados necessários para gerar as análises de IA após inserção
    type SeedEntry = {
      student: Student;
      assessments: Assessment[];
      lastAssessmentId: string;
    };
    const seedEntries: SeedEntry[] = [];

    // ── 2. Insere atletas e avaliações sequencialmente ────────────────────────
    for (const athlete of ATHLETES) {
      const { data: studentRow, error: studentErr } = await supabase
        .from("students")
        .insert({
          user_id: user.id,
          name: athlete.name,
          age: athlete.age,
          weight: athlete.weight,
          height: athlete.height,
          objective: athlete.objective,
        })
        .select("id, created_at")
        .single();

      if (studentErr) throw new Error(`Erro ao criar ${athlete.name}: ${studentErr.message}`);

      const studentId: string = studentRow.id;

      const assessmentRows = athlete.assessments.map((a) => {
        const left = a.cmjEsquerdo;
        const right = a.cmjDireito;
        const asymmetry = left && right ? asym(left, right) : null;
        return {
          student_id: studentId,
          user_id: user.id,
          date: a.date,
          cmj: round(a.cmj),
          sj: round(a.sj),
          abalakov: round(a.abalakov),
          rsi: round(a.rsi, 3),
          tempo_contato: round(a.tempoContato, 1),
          altura_salto_dj: round(a.alturaSaltoDJ),
          cmj_esquerdo: round(a.cmjEsquerdo),
          cmj_direito: round(a.cmjDireito),
          assimetria_percentual: asymmetry,
          salto_horizontal: round(a.saltoHorizontal, 1),
        };
      });

      // Pega os IDs de volta para poder salvar o last_assessment_id depois
      const { data: insertedAssessments, error: assessErr } = await supabase
        .from("assessments")
        .insert(assessmentRows)
        .select("id, date");

      if (assessErr) throw new Error(`Erro nas avaliações de ${athlete.name}: ${assessErr.message}`);

      // A última avaliação no array (mais recente) = último item após ordenar por date
      const sortedByDate = [...insertedAssessments].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const lastAssessmentId: string = sortedByDate[sortedByDate.length - 1].id;

      // Monta os objetos tipados para o prompt de IA
      const typedStudent: Student = {
        id: studentId,
        name: athlete.name,
        age: athlete.age,
        weight: athlete.weight,
        height: athlete.height,
        objective: athlete.objective,
        photoUrl: null,
        createdAt: studentRow.created_at,
      };

      const typedAssessments: Assessment[] = athlete.assessments.map((a, idx) => ({
        id: insertedAssessments[idx]?.id ?? "",
        studentId,
        date: a.date,
        metrics: {
          cmj: a.cmj,
          sj: a.sj,
          abalakov: a.abalakov,
          rsi: a.rsi,
          tempoContato: a.tempoContato,
          alturaSaltoDJ: a.alturaSaltoDJ,
          cmjEsquerdo: a.cmjEsquerdo,
          cmjDireito: a.cmjDireito,
          assimetriaPercentual: asym(a.cmjEsquerdo, a.cmjDireito),
          saltoHorizontal: a.saltoHorizontal,
        },
      }));

      seedEntries.push({ student: typedStudent, assessments: typedAssessments, lastAssessmentId });
    }

    // ── 3. Gera análises de IA em paralelo com concorrência = 3 ──────────────
    //   Promise.allSettled garante que uma falha não cancela as demais.
    const analysisResults: { name: string; aiStatus: string }[] = [];

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const analysisTasks = seedEntries.map(({ student, assessments, lastAssessmentId }) => async () => {
        const content = await generateAnalysis(anthropic, student, assessments);

        // Salva diretamente no banco (sem passar pelo storage client-side)
        const { error } = await supabase.from("ai_analyses").insert({
          student_id: student.id,
          user_id: user.id,
          content,
          last_assessment_id: lastAssessmentId,
        });

        if (error) throw new Error(`Erro ao salvar análise de ${student.name}: ${error.message}`);
        return student.name;
      });

      // Máximo 3 chamadas simultâneas à API da Anthropic
      const settled = await pooled(analysisTasks, 3);

      for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        analysisResults.push({
          name: seedEntries[i].student.name,
          aiStatus: r.status === "fulfilled"
            ? "✓ análise gerada"
            : `✗ erro: ${r.status === "rejected" ? String(r.reason) : "desconhecido"}`,
        });
      }
    } else {
      // Sem chave de API — apenas registra que foi pulado
      for (const entry of seedEntries) {
        analysisResults.push({ name: entry.student.name, aiStatus: "— ANTHROPIC_API_KEY não configurada" });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${ATHLETES.length} atletas inseridos. Análises de IA: ${analysisResults.filter((r) => r.aiStatus.startsWith("✓")).length}/${ATHLETES.length} geradas.`,
      athletes: seedEntries.map(({ student, assessments }, i) => ({
        student: student.name,
        assessments: assessments.length,
        aiStatus: analysisResults[i]?.aiStatus ?? "—",
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await supabase.from("ai_analyses").delete().eq("user_id", user.id);
    await supabase.from("assessments").delete().eq("user_id", user.id);
    await supabase.from("students").delete().eq("user_id", user.id);

    return NextResponse.json({ ok: true, message: "Todos os dados foram removidos." });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
