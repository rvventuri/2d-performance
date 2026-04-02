export interface Student {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  objective: string;
  createdAt: string;
}

export interface Metrics {
  cmj: number | null;
  sj: number | null;
  abalakov: number | null;
  rsi: number | null;
  tempoContato: number | null;
  alturaSaltoDJ: number | null;
  cmjEsquerdo: number | null;
  cmjDireito: number | null;
  assimetriaPercentual: number | null;
  saltoHorizontal: number | null;
}

export interface Assessment {
  id: string;
  studentId: string;
  date: string;
  metrics: Metrics;
}

export const METRIC_LABELS: Record<keyof Metrics, string> = {
  cmj: "CMJ (cm)",
  sj: "SJ (cm)",
  abalakov: "Abalakov (cm)",
  rsi: "RSI",
  tempoContato: "Tempo de Contato (ms)",
  alturaSaltoDJ: "Altura Salto DJ (cm)",
  cmjEsquerdo: "CMJ Esquerdo (cm)",
  cmjDireito: "CMJ Direito (cm)",
  assimetriaPercentual: "Assimetria (%)",
  saltoHorizontal: "Salto Horizontal (cm)",
};

// ─── AI Analysis structured data ─────────────────────────────────────────────

export type MetricStatus = "elite" | "advanced" | "good" | "developing" | "critical";
export type AlertPriority = "high" | "medium" | "low";
export type EvolutionTrend = "improving" | "stable" | "declining";

export interface AiMetricScore {
  key: string;
  label: string;
  value: number;
  unit: string;
  score: number;          // 0–100
  percentile: number;     // vs atletas treinados
  status: MetricStatus;
  higherIsBetter: boolean;
  benchmarks: {
    recreational: number;
    trained: number;
    elite: number;
  };
  interpretation: string;
}

export interface AiRadarPoint {
  metric: string;
  athlete: number;  // 0–100 normalizado
  trained: number;  // 0–100 referência treinado
  elite: number;    // 0–100 referência elite
}

export interface AiStrength {
  title: string;
  description: string;
  metric?: string;
}

export interface AiAlert {
  priority: AlertPriority;
  title: string;
  description: string;
}

export interface AiEvolution {
  trend: EvolutionTrend;
  highlight: string;
  details: string;
  keyMetrics: {
    label: string;
    change: number;      // percentual
    direction: "up" | "down" | "flat";
  }[];
}

export interface AiPrescription {
  priority: 1 | 2 | 3;
  quality: string;
  title: string;
  rationale: string;
  examples: string[];
  frequency?: string;
}

export interface AiAnalysisData {
  performanceScore: number;  // 0–100 escore geral
  profileType: string;       // ex: "Atleta Elástico-Reativo"
  profileDescription: string;
  summary: string;
  objectiveAlignment: {
    score: number;     // 0–100
    keyGap: string;
    timeline: string;
  };
  metricScores: AiMetricScore[];
  radarData: AiRadarPoint[];
  strengths: AiStrength[];
  alerts: AiAlert[];
  evolution: AiEvolution | null;
  prescriptions: AiPrescription[];
}

export const METRIC_UNITS: Record<keyof Metrics, string> = {
  cmj: "cm",
  sj: "cm",
  abalakov: "cm",
  rsi: "",
  tempoContato: "ms",
  alturaSaltoDJ: "cm",
  cmjEsquerdo: "cm",
  cmjDireito: "cm",
  assimetriaPercentual: "%",
  saltoHorizontal: "cm",
};
