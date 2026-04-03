export interface Student {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  objective: string;
  photoUrl: string | null;
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
  customMetrics?: Record<string, number | null>;
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

// ─── Share Links ─────────────────────────────────────────────────────────────

export interface ShareLink {
  id: string;
  studentId: string;
  userId: string;
  token: string;
  hasPassword: boolean;
  createdAt: string;
}

export interface ShareAthleteData {
  student: Pick<Student, "name" | "age" | "weight" | "height" | "objective" | "photoUrl">;
  assessments: Assessment[];
  aiAnalysis: AiAnalysisData | null;
}

// ─── Trainer Personalization ──────────────────────────────────────────────────

export interface TrainerProfile {
  id: string;
  userId: string;
  coachingPhilosophy: string;
  sportContext: string;
  athleteProfiles: string;
  priorityFocus: string;
  customInstructions: string;
  updatedAt: string;
}

export interface MetricConfig {
  id: string;
  userId: string;
  metricKey: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  isCustom: boolean;
  isEnabled: boolean;
  benchRecreational: number | null;
  benchTrained: number | null;
  benchElite: number | null;
  weight: number;
  displayOrder: number;
  createdAt: string;
}

export interface DefaultMetricSpec {
  key: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  benchRecreational: number;
  benchTrained: number;
  benchElite: number;
}

export interface ResolvedMetricConfig extends DefaultMetricSpec {
  isEnabled: boolean;
  weight: number;
  isCustom: boolean;
  displayOrder: number;
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
