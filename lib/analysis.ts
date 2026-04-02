import { Assessment, Metrics } from "./types";

export interface AnalysisInsight {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

export interface MetricEvolution {
  key: keyof Metrics;
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
}

export function analyzeAssessment(
  current: Assessment,
  previous?: Assessment
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  const m = current.metrics;

  // Asymmetry risk
  if (m.assimetriaPercentual !== null) {
    if (m.assimetriaPercentual > 15) {
      insights.push({
        type: "warning",
        title: "Alto Risco de Lesão",
        description: `Assimetria de ${m.assimetriaPercentual.toFixed(1)}% detectada — acima de 15%. Risco elevado de lesão. Priorize trabalho de reequilíbrio bilateral.`,
      });
    } else if (m.assimetriaPercentual > 10) {
      insights.push({
        type: "warning",
        title: "Alerta de Assimetria",
        description: `Assimetria de ${m.assimetriaPercentual.toFixed(1)}% — acima do limiar de 10%. Monitore de perto e inclua exercícios unilaterais.`,
      });
    } else {
      insights.push({
        type: "success",
        title: "Simetria Adequada",
        description: `Assimetria de ${m.assimetriaPercentual.toFixed(1)}% dentro do padrão aceitável (≤10%).`,
      });
    }
  }

  // Elastic cycle: CMJ vs SJ
  if (m.cmj !== null && m.sj !== null) {
    const elasticBonus = m.cmj - m.sj;
    const elasticPct = m.sj > 0 ? (elasticBonus / m.sj) * 100 : 0;
    if (elasticBonus > 0) {
      insights.push({
        type: "success",
        title: "Ciclo Elástico Positivo",
        description: `CMJ supera SJ em ${elasticBonus.toFixed(1)} cm (+${elasticPct.toFixed(0)}%). O atleta utiliza bem o ciclo alongamento-encurtamento (SSC).`,
      });
    } else if (elasticBonus < -2) {
      insights.push({
        type: "warning",
        title: "Déficit no Ciclo Elástico",
        description: `SJ supera CMJ em ${Math.abs(elasticBonus).toFixed(1)} cm. Possível fadiga, tensão muscular excessiva ou déficit na utilização do SSC. Revisar técnica de agachamento e mobilidade.`,
      });
    } else {
      insights.push({
        type: "info",
        title: "Ciclo Elástico Neutro",
        description: `CMJ e SJ praticamente iguais. O aproveitamento do ciclo elástico é limitado. Trabalhar pliometria e reatividade.`,
      });
    }
  }

  // RSI reactivity
  if (m.rsi !== null) {
    if (m.rsi >= 2.0) {
      insights.push({
        type: "success",
        title: "Alta Reatividade (RSI Elite)",
        description: `RSI de ${m.rsi.toFixed(2)} — nível elite. Excelente capacidade reativa e aproveitamento do SSC rápido.`,
      });
    } else if (m.rsi >= 1.5) {
      insights.push({
        type: "success",
        title: "Boa Reatividade (RSI Avançado)",
        description: `RSI de ${m.rsi.toFixed(2)} — nível avançado. Boa capacidade reativa com potencial de melhora.`,
      });
    } else if (m.rsi >= 1.0) {
      insights.push({
        type: "info",
        title: "Reatividade Moderada",
        description: `RSI de ${m.rsi.toFixed(2)} — nível intermediário. Foco em treinos de drop jump e pliometria de alta intensidade.`,
      });
    } else if (m.rsi !== null) {
      insights.push({
        type: "warning",
        title: "Baixa Reatividade",
        description: `RSI de ${m.rsi.toFixed(2)} — abaixo de 1.0. Priorize desenvolvimento de força reativa e tempo de contato.`,
      });
    }
  }

  // Contact time interpretation
  if (m.tempoContato !== null && m.rsi !== null) {
    if (m.tempoContato < 200) {
      insights.push({
        type: "success",
        title: "Tempo de Contato Excelente",
        description: `Tempo de contato de ${m.tempoContato}ms — muito rápido, ideal para sprinters e saltadores de elite.`,
      });
    } else if (m.tempoContato > 300) {
      insights.push({
        type: "info",
        title: "Tempo de Contato Elevado",
        description: `Tempo de contato de ${m.tempoContato}ms. Reduzir o tempo de contato com treinos de reatividade curta (drop jumps de baixa altura).`,
      });
    }
  }

  // Evolution insights
  if (previous) {
    const pm = previous.metrics;
    if (m.cmj !== null && pm.cmj !== null) {
      const diff = m.cmj - pm.cmj;
      const pct = (diff / pm.cmj) * 100;
      if (diff > 0) {
        insights.push({
          type: "success",
          title: "Evolução no CMJ",
          description: `CMJ aumentou ${diff.toFixed(1)} cm (+${pct.toFixed(1)}%) em relação à avaliação anterior. Ótima resposta ao treinamento.`,
        });
      } else if (diff < -1) {
        insights.push({
          type: "warning",
          title: "Queda no CMJ",
          description: `CMJ reduziu ${Math.abs(diff).toFixed(1)} cm (${pct.toFixed(1)}%). Verificar acúmulo de fadiga, recuperação e carga de treinamento.`,
        });
      }
    }
  }

  return insights;
}

export function calcEvolution(
  current: Assessment,
  previous?: Assessment
): MetricEvolution[] {
  const keys = Object.keys(current.metrics) as (keyof Metrics)[];
  return keys.map((key) => {
    const curr = current.metrics[key];
    const prev = previous?.metrics[key] ?? null;
    const change = curr !== null && prev !== null ? curr - prev : null;
    const changePercent =
      change !== null && prev !== null && prev !== 0
        ? (change / Math.abs(prev)) * 100
        : null;
    return { key, current: curr, previous: prev, change, changePercent };
  });
}
