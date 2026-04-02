import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asym(left: number, right: number) {
  const max = Math.max(left, right);
  return parseFloat(((Math.abs(left - right) / max) * 100).toFixed(2));
}

function round(n: number, decimals = 2) {
  return parseFloat(n.toFixed(decimals));
}

// ─── Dados dos atletas ────────────────────────────────────────────────────────

const ATHLETES = [
  {
    name: "Rafael Costa",
    age: 22,
    weight: 76.0,
    height: 178.0,
    objective:
      "Melhorar potência explosiva e aceleração nos sprints para ganhar posição no elenco profissional de futebol",
    // Jogador de futebol — boa evolução geral, assimetria moderada herdada de entorse
    assessments: [
      {
        date: "2024-08-05",
        cmj: 38.4,
        sj: 34.2,
        abalakov: 44.1,
        rsi: 1.42,
        tempoContato: 248,
        alturaSaltoDJ: 35.2,
        cmjEsquerdo: 35.6,
        cmjDireito: 40.8,
        saltoHorizontal: 218.0,
      },
      {
        date: "2024-09-10",
        cmj: 39.8,
        sj: 34.9,
        abalakov: 45.6,
        rsi: 1.51,
        tempoContato: 238,
        alturaSaltoDJ: 36.0,
        cmjEsquerdo: 36.4,
        cmjDireito: 42.1,
        saltoHorizontal: 222.0,
      },
      {
        date: "2024-10-15",
        cmj: 41.2,
        sj: 36.1,
        abalakov: 47.3,
        rsi: 1.59,
        tempoContato: 231,
        alturaSaltoDJ: 36.8,
        cmjEsquerdo: 37.8,
        cmjDireito: 43.5,
        saltoHorizontal: 227.5,
      },
      {
        date: "2024-11-20",
        cmj: 42.7,
        sj: 37.4,
        abalakov: 48.9,
        rsi: 1.65,
        tempoContato: 224,
        alturaSaltoDJ: 37.5,
        cmjEsquerdo: 39.1,
        cmjDireito: 45.2,
        saltoHorizontal: 232.0,
      },
      {
        date: "2025-01-08",
        cmj: 41.5,
        sj: 37.0,
        abalakov: 48.2,
        rsi: 1.61,
        tempoContato: 229,
        alturaSaltoDJ: 37.1,
        cmjEsquerdo: 38.3,
        cmjDireito: 44.6,
        saltoHorizontal: 229.5,
      },
      {
        date: "2025-02-12",
        cmj: 44.1,
        sj: 38.8,
        abalakov: 50.4,
        rsi: 1.74,
        tempoContato: 215,
        alturaSaltoDJ: 38.3,
        cmjEsquerdo: 40.5,
        cmjDireito: 46.8,
        saltoHorizontal: 237.0,
      },
      {
        date: "2025-03-18",
        cmj: 45.6,
        sj: 39.7,
        abalakov: 52.1,
        rsi: 1.82,
        tempoContato: 208,
        alturaSaltoDJ: 39.2,
        cmjEsquerdo: 41.8,
        cmjDireito: 48.2,
        saltoHorizontal: 241.5,
      },
    ],
  },

  {
    name: "Ana Beatriz Santos",
    age: 24,
    weight: 58.0,
    height: 168.0,
    objective:
      "Maximizar potência horizontal e reatividade para competições de salto em distância — meta de 6,80m na temporada",
    // Velocista/saltadora — RSI alto, excelente ciclo elástico, foco em horizontal
    assessments: [
      {
        date: "2024-09-02",
        cmj: 46.8,
        sj: 38.5,
        abalakov: 52.3,
        rsi: 2.12,
        tempoContato: 196,
        alturaSaltoDJ: 41.6,
        cmjEsquerdo: 44.1,
        cmjDireito: 46.2,
        saltoHorizontal: 248.0,
      },
      {
        date: "2024-10-07",
        cmj: 48.2,
        sj: 39.4,
        abalakov: 54.1,
        rsi: 2.21,
        tempoContato: 191,
        alturaSaltoDJ: 42.3,
        cmjEsquerdo: 45.6,
        cmjDireito: 47.8,
        saltoHorizontal: 253.5,
      },
      {
        date: "2024-11-12",
        cmj: 49.6,
        sj: 40.2,
        abalakov: 55.8,
        rsi: 2.34,
        tempoContato: 184,
        alturaSaltoDJ: 43.1,
        cmjEsquerdo: 47.2,
        cmjDireito: 49.1,
        saltoHorizontal: 258.0,
      },
      {
        date: "2024-12-17",
        cmj: 47.9,
        sj: 39.8,
        abalakov: 54.6,
        rsi: 2.28,
        tempoContato: 188,
        alturaSaltoDJ: 42.8,
        cmjEsquerdo: 45.8,
        cmjDireito: 48.4,
        saltoHorizontal: 255.5,
      },
      {
        date: "2025-01-21",
        cmj: 51.3,
        sj: 41.6,
        abalakov: 57.4,
        rsi: 2.48,
        tempoContato: 178,
        alturaSaltoDJ: 44.2,
        cmjEsquerdo: 48.9,
        cmjDireito: 51.6,
        saltoHorizontal: 264.0,
      },
      {
        date: "2025-02-25",
        cmj: 52.7,
        sj: 42.3,
        abalakov: 59.1,
        rsi: 2.61,
        tempoContato: 172,
        alturaSaltoDJ: 45.0,
        cmjEsquerdo: 50.1,
        cmjDireito: 53.2,
        saltoHorizontal: 269.5,
      },
    ],
  },

  {
    name: "Lucas Almeida",
    age: 20,
    weight: 88.0,
    height: 192.0,
    objective:
      "Aumentar altura de salto vertical e RSI para melhorar desempenho em bandeja, rebote e bloqueio no basquete universitário",
    // Basquetista pesado — bom CMJ, RSI intermediário, ciclo elástico a melhorar
    assessments: [
      {
        date: "2024-08-19",
        cmj: 52.1,
        sj: 47.8,
        abalakov: 60.4,
        rsi: 1.28,
        tempoContato: 296,
        alturaSaltoDJ: 38.0,
        cmjEsquerdo: 49.6,
        cmjDireito: 51.3,
        saltoHorizontal: 236.0,
      },
      {
        date: "2024-09-23",
        cmj: 53.8,
        sj: 48.5,
        abalakov: 62.1,
        rsi: 1.35,
        tempoContato: 286,
        alturaSaltoDJ: 38.7,
        cmjEsquerdo: 51.2,
        cmjDireito: 53.0,
        saltoHorizontal: 239.5,
      },
      {
        date: "2024-10-28",
        cmj: 55.2,
        sj: 49.1,
        abalakov: 63.8,
        rsi: 1.43,
        tempoContato: 274,
        alturaSaltoDJ: 39.4,
        cmjEsquerdo: 52.6,
        cmjDireito: 54.8,
        saltoHorizontal: 243.0,
      },
      {
        date: "2024-12-03",
        cmj: 56.9,
        sj: 49.8,
        abalakov: 65.4,
        rsi: 1.51,
        tempoContato: 264,
        alturaSaltoDJ: 40.2,
        cmjEsquerdo: 54.1,
        cmjDireito: 56.6,
        saltoHorizontal: 247.5,
      },
      {
        date: "2025-01-14",
        cmj: 58.4,
        sj: 50.6,
        abalakov: 67.2,
        rsi: 1.62,
        tempoContato: 253,
        alturaSaltoDJ: 41.1,
        cmjEsquerdo: 55.8,
        cmjDireito: 58.2,
        saltoHorizontal: 251.0,
      },
      {
        date: "2025-02-18",
        cmj: 60.1,
        sj: 51.4,
        abalakov: 69.0,
        rsi: 1.74,
        tempoContato: 241,
        alturaSaltoDJ: 42.0,
        cmjEsquerdo: 57.4,
        cmjDireito: 60.1,
        saltoHorizontal: 255.0,
      },
      {
        date: "2025-03-25",
        cmj: 61.8,
        sj: 52.2,
        abalakov: 70.8,
        rsi: 1.84,
        tempoContato: 232,
        alturaSaltoDJ: 42.8,
        cmjEsquerdo: 59.0,
        cmjDireito: 61.9,
        saltoHorizontal: 258.5,
      },
    ],
  },

  {
    name: "Camila Ferreira",
    age: 26,
    weight: 68.0,
    height: 175.0,
    objective:
      "Aumentar altura de ataque no vôlei e reduzir tempo de contato no bloqueio para chegar ao time titular da seleção estadual",
    // Jogadora de vôlei — CMJ alto, precisa reduzir tempo de contato para melhorar RSI
    assessments: [
      {
        date: "2024-08-12",
        cmj: 44.2,
        sj: 37.1,
        abalakov: 51.8,
        rsi: 1.58,
        tempoContato: 272,
        alturaSaltoDJ: 43.0,
        cmjEsquerdo: 42.5,
        cmjDireito: 44.8,
        saltoHorizontal: 226.0,
      },
      {
        date: "2024-09-16",
        cmj: 45.6,
        sj: 37.9,
        abalakov: 53.1,
        rsi: 1.64,
        tempoContato: 263,
        alturaSaltoDJ: 43.8,
        cmjEsquerdo: 43.7,
        cmjDireito: 46.1,
        saltoHorizontal: 229.0,
      },
      {
        date: "2024-10-21",
        cmj: 47.1,
        sj: 38.8,
        abalakov: 54.6,
        rsi: 1.72,
        tempoContato: 252,
        alturaSaltoDJ: 43.4,
        cmjEsquerdo: 45.2,
        cmjDireito: 47.5,
        saltoHorizontal: 232.5,
      },
      {
        date: "2024-11-25",
        cmj: 48.4,
        sj: 39.5,
        abalakov: 56.0,
        rsi: 1.81,
        tempoContato: 241,
        alturaSaltoDJ: 43.9,
        cmjEsquerdo: 46.3,
        cmjDireito: 48.9,
        saltoHorizontal: 235.5,
      },
      {
        date: "2025-01-06",
        cmj: 49.8,
        sj: 40.3,
        abalakov: 57.5,
        rsi: 1.93,
        tempoContato: 228,
        alturaSaltoDJ: 44.6,
        cmjEsquerdo: 47.8,
        cmjDireito: 50.2,
        saltoHorizontal: 239.0,
      },
      {
        date: "2025-02-10",
        cmj: 51.2,
        sj: 41.1,
        abalakov: 59.1,
        rsi: 2.04,
        tempoContato: 216,
        alturaSaltoDJ: 44.8,
        cmjEsquerdo: 49.1,
        cmjDireito: 51.8,
        saltoHorizontal: 242.5,
      },
      {
        date: "2025-03-17",
        cmj: 52.5,
        sj: 41.8,
        abalakov: 60.4,
        rsi: 2.16,
        tempoContato: 204,
        alturaSaltoDJ: 44.4,
        cmjEsquerdo: 50.4,
        cmjDireito: 53.0,
        saltoHorizontal: 245.0,
      },
    ],
  },

  {
    name: "Marcos Oliveira",
    age: 29,
    weight: 98.0,
    height: 185.0,
    objective:
      "Corrigir assimetria bilateral severa e desenvolver potência reativa para o rugby — retorno pós-lesão de LCA esquerdo",
    // Retorno pós-LCA — assimetria alta no início, reduzindo progressivamente
    assessments: [
      {
        date: "2024-09-04",
        cmj: 34.2,
        sj: 31.8,
        abalakov: 40.5,
        rsi: 0.88,
        tempoContato: 342,
        alturaSaltoDJ: 30.2,
        cmjEsquerdo: 26.4,
        cmjDireito: 38.1,
        saltoHorizontal: 198.5,
      },
      {
        date: "2024-10-09",
        cmj: 36.5,
        sj: 33.2,
        abalakov: 42.8,
        rsi: 0.96,
        tempoContato: 328,
        alturaSaltoDJ: 31.5,
        cmjEsquerdo: 29.1,
        cmjDireito: 39.8,
        saltoHorizontal: 204.0,
      },
      {
        date: "2024-11-14",
        cmj: 38.8,
        sj: 34.9,
        abalakov: 45.1,
        rsi: 1.06,
        tempoContato: 312,
        alturaSaltoDJ: 33.1,
        cmjEsquerdo: 32.4,
        cmjDireito: 41.2,
        saltoHorizontal: 210.5,
      },
      {
        date: "2024-12-19",
        cmj: 40.6,
        sj: 36.1,
        abalakov: 47.2,
        rsi: 1.15,
        tempoContato: 298,
        alturaSaltoDJ: 34.3,
        cmjEsquerdo: 35.8,
        cmjDireito: 42.6,
        saltoHorizontal: 216.0,
      },
      {
        date: "2025-01-28",
        cmj: 42.9,
        sj: 37.4,
        abalakov: 49.5,
        rsi: 1.26,
        tempoContato: 281,
        alturaSaltoDJ: 35.5,
        cmjEsquerdo: 38.6,
        cmjDireito: 44.1,
        saltoHorizontal: 221.5,
      },
      {
        date: "2025-03-04",
        cmj: 45.1,
        sj: 38.8,
        abalakov: 51.8,
        rsi: 1.38,
        tempoContato: 264,
        alturaSaltoDJ: 36.6,
        cmjEsquerdo: 41.8,
        cmjDireito: 46.2,
        saltoHorizontal: 228.0,
      },
    ],
  },

  {
    name: "Juliana Martins",
    age: 21,
    weight: 54.0,
    height: 163.0,
    objective:
      "Desenvolver força máxima e potência no salto para transição do atletismo para o crossfit competitivo — foco em movimentos olímpicos e box jump",
    // Atleta leve, excelente coordenação, RSI já alto, trabalhando força base
    assessments: [
      {
        date: "2024-08-26",
        cmj: 40.8,
        sj: 32.4,
        abalakov: 47.2,
        rsi: 2.28,
        tempoContato: 178,
        alturaSaltoDJ: 40.6,
        cmjEsquerdo: 39.6,
        cmjDireito: 41.4,
        saltoHorizontal: 231.0,
      },
      {
        date: "2024-09-30",
        cmj: 42.1,
        sj: 34.2,
        abalakov: 48.8,
        rsi: 2.36,
        tempoContato: 174,
        alturaSaltoDJ: 41.1,
        cmjEsquerdo: 40.8,
        cmjDireito: 42.6,
        saltoHorizontal: 234.5,
      },
      {
        date: "2024-11-04",
        cmj: 43.6,
        sj: 36.1,
        abalakov: 50.4,
        rsi: 2.44,
        tempoContato: 169,
        alturaSaltoDJ: 41.7,
        cmjEsquerdo: 42.1,
        cmjDireito: 44.0,
        saltoHorizontal: 238.0,
      },
      {
        date: "2024-12-10",
        cmj: 44.9,
        sj: 37.8,
        abalakov: 51.9,
        rsi: 2.52,
        tempoContato: 164,
        alturaSaltoDJ: 41.3,
        cmjEsquerdo: 43.5,
        cmjDireito: 45.4,
        saltoHorizontal: 241.5,
      },
      {
        date: "2025-01-15",
        cmj: 46.2,
        sj: 39.4,
        abalakov: 53.5,
        rsi: 2.61,
        tempoContato: 159,
        alturaSaltoDJ: 41.8,
        cmjEsquerdo: 44.8,
        cmjDireito: 46.8,
        saltoHorizontal: 245.0,
      },
      {
        date: "2025-02-19",
        cmj: 47.8,
        sj: 41.2,
        abalakov: 55.2,
        rsi: 2.72,
        tempoContato: 154,
        alturaSaltoDJ: 42.5,
        cmjEsquerdo: 46.4,
        cmjDireito: 48.2,
        saltoHorizontal: 248.5,
      },
    ],
  },

  {
    name: "Pedro Henrique Ramos",
    age: 18,
    weight: 82.0,
    height: 181.0,
    objective:
      "Desenvolver potência horizontal e aceleração para o futebol americano — posição de wide receiver, foco em saída de linha e sprint curto",
    // Jovem promissor — grande margem de evolução, ciclo elástico ainda imaturo
    assessments: [
      {
        date: "2024-10-01",
        cmj: 36.8,
        sj: 34.1,
        abalakov: 43.2,
        rsi: 1.18,
        tempoContato: 312,
        alturaSaltoDJ: 36.8,
        cmjEsquerdo: 34.2,
        cmjDireito: 37.8,
        saltoHorizontal: 224.0,
      },
      {
        date: "2024-11-05",
        cmj: 38.4,
        sj: 34.8,
        abalakov: 44.8,
        rsi: 1.26,
        tempoContato: 301,
        alturaSaltoDJ: 37.9,
        cmjEsquerdo: 35.6,
        cmjDireito: 39.4,
        saltoHorizontal: 228.5,
      },
      {
        date: "2024-12-10",
        cmj: 40.1,
        sj: 35.6,
        abalakov: 46.4,
        rsi: 1.35,
        tempoContato: 289,
        alturaSaltoDJ: 39.0,
        cmjEsquerdo: 37.4,
        cmjDireito: 41.0,
        saltoHorizontal: 233.0,
      },
      {
        date: "2025-01-14",
        cmj: 42.2,
        sj: 36.8,
        abalakov: 48.5,
        rsi: 1.46,
        tempoContato: 276,
        alturaSaltoDJ: 40.2,
        cmjEsquerdo: 39.5,
        cmjDireito: 43.1,
        saltoHorizontal: 238.0,
      },
      {
        date: "2025-02-18",
        cmj: 44.0,
        sj: 37.9,
        abalakov: 50.6,
        rsi: 1.58,
        tempoContato: 262,
        alturaSaltoDJ: 41.4,
        cmjEsquerdo: 41.6,
        cmjDireito: 45.2,
        saltoHorizontal: 243.5,
      },
      {
        date: "2025-03-25",
        cmj: 46.1,
        sj: 39.1,
        abalakov: 52.8,
        rsi: 1.71,
        tempoContato: 248,
        alturaSaltoDJ: 42.6,
        cmjEsquerdo: 43.8,
        cmjDireito: 47.1,
        saltoHorizontal: 249.0,
      },
    ],
  },

  {
    name: "Fernanda Lima",
    age: 23,
    weight: 56.0,
    height: 165.0,
    objective:
      "Reduzir tempo de contato e elevar RSI para quebrar marca pessoal nos 100m rasos — preparação para seletiva nacional",
    // Velocista — RSI é a métrica chave, quer tempo de contato < 160ms
    assessments: [
      {
        date: "2024-09-09",
        cmj: 43.6,
        sj: 36.8,
        abalakov: 49.4,
        rsi: 1.94,
        tempoContato: 212,
        alturaSaltoDJ: 41.2,
        cmjEsquerdo: 42.4,
        cmjDireito: 44.1,
        saltoHorizontal: 244.0,
      },
      {
        date: "2024-10-14",
        cmj: 44.8,
        sj: 37.5,
        abalakov: 50.9,
        rsi: 2.04,
        tempoContato: 204,
        alturaSaltoDJ: 41.8,
        cmjEsquerdo: 43.5,
        cmjDireito: 45.2,
        saltoHorizontal: 247.5,
      },
      {
        date: "2024-11-19",
        cmj: 46.1,
        sj: 38.4,
        abalakov: 52.4,
        rsi: 2.18,
        tempoContato: 194,
        alturaSaltoDJ: 42.4,
        cmjEsquerdo: 44.8,
        cmjDireito: 46.5,
        saltoHorizontal: 251.0,
      },
      {
        date: "2025-01-06",
        cmj: 47.5,
        sj: 39.2,
        abalakov: 54.0,
        rsi: 2.33,
        tempoContato: 184,
        alturaSaltoDJ: 43.0,
        cmjEsquerdo: 46.2,
        cmjDireito: 47.9,
        saltoHorizontal: 255.0,
      },
      {
        date: "2025-02-10",
        cmj: 48.8,
        sj: 40.1,
        abalakov: 55.5,
        rsi: 2.48,
        tempoContato: 176,
        alturaSaltoDJ: 43.7,
        cmjEsquerdo: 47.4,
        cmjDireito: 49.3,
        saltoHorizontal: 258.5,
      },
      {
        date: "2025-03-17",
        cmj: 50.2,
        sj: 41.0,
        abalakov: 57.1,
        rsi: 2.64,
        tempoContato: 168,
        alturaSaltoDJ: 44.4,
        cmjEsquerdo: 48.8,
        cmjDireito: 50.8,
        saltoHorizontal: 262.5,
      },
    ],
  },
];

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
    // 1. Remove dados existentes do usuário (ordem importa por FK)
    await supabase.from("ai_analyses").delete().eq("user_id", user.id);
    await supabase.from("assessments").delete().eq("user_id", user.id);
    await supabase.from("students").delete().eq("user_id", user.id);

    const results: { student: string; assessments: number }[] = [];

    for (const athlete of ATHLETES) {
      // 2. Cria o atleta
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
        .select("id")
        .single();

      if (studentErr) throw new Error(`Erro ao criar ${athlete.name}: ${studentErr.message}`);

      const studentId = studentRow.id;

      // 3. Cria as avaliações calculando assimetria automaticamente
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

      const { error: assessErr } = await supabase
        .from("assessments")
        .insert(assessmentRows);

      if (assessErr) throw new Error(`Erro nas avaliações de ${athlete.name}: ${assessErr.message}`);

      results.push({ student: athlete.name, assessments: assessmentRows.length });
    }

    return NextResponse.json({
      ok: true,
      message: `${ATHLETES.length} atletas inseridos com sucesso.`,
      results,
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
