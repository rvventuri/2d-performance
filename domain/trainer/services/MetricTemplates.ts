import type { MetricConfig } from "@/lib/types";
import { DEFAULT_METRICS } from "./DefaultMetrics";
import { isLegacyAssessmentMetricKey } from "./MetricConfigResolver";

export type TemplateMetricInput = Omit<MetricConfig, "id" | "userId" | "createdAt">;

export interface MetricTemplateDefinition {
  id: string;
  title: string;
  description: string;
  metrics: TemplateMetricInput[];
}

function tpl(partial: {
  metricKey: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  displayOrder: number;
  benchRecreational?: number | null;
  benchTrained?: number | null;
  benchElite?: number | null;
  weight?: number;
  isEnabled?: boolean;
}): TemplateMetricInput {
  const isCustom = !isLegacyAssessmentMetricKey(partial.metricKey);
  return {
    metricKey: partial.metricKey,
    label: partial.label,
    unit: partial.unit,
    higherIsBetter: partial.higherIsBetter,
    isCustom,
    isEnabled: partial.isEnabled ?? true,
    benchRecreational: partial.benchRecreational ?? null,
    benchTrained: partial.benchTrained ?? null,
    benchElite: partial.benchElite ?? null,
    weight: partial.weight ?? 1,
    displayOrder: partial.displayOrder,
  };
}

const PREPARADOR_METRICS: TemplateMetricInput[] = DEFAULT_METRICS.map((def, i) =>
  tpl({
    metricKey: def.key,
    label: def.label,
    unit: def.unit,
    higherIsBetter: def.higherIsBetter,
    benchRecreational: def.benchRecreational,
    benchTrained: def.benchTrained,
    benchElite: def.benchElite,
    displayOrder: i,
  })
);

/** Pace em min/km como decimal (ex.: 5.5 = 5 min 30 s por km). */
const RUNNING_PACE_NOTE =
  "Valor decimal min/km (ex.: 5.5 = 5min30s/km). Menor = melhor.";

export const METRIC_TEMPLATES: MetricTemplateDefinition[] = [
  {
    id: "personal_trainer_strength",
    title: "Personal trainer (força / performance)",
    description:
      "Carga, repetições, RPE e marcadores de composição para evolução clara no treino de força.",
    metrics: [
      tpl({
        metricKey: "loadKg",
        label: "Carga (principal)",
        unit: "kg",
        higherIsBetter: true,
        benchRecreational: 20,
        benchTrained: 60,
        benchElite: 120,
        displayOrder: 0,
      }),
      tpl({
        metricKey: "reps",
        label: "Repetições",
        unit: "nº",
        higherIsBetter: true,
        benchRecreational: 6,
        benchTrained: 10,
        benchElite: 15,
        displayOrder: 1,
      }),
      tpl({
        metricKey: "rpe",
        label: "RPE (esforço)",
        unit: "/10",
        higherIsBetter: false,
        benchRecreational: 9,
        benchTrained: 7,
        benchElite: 5,
        displayOrder: 2,
      }),
      tpl({
        metricKey: "bodyWeightKg",
        label: "Peso corporal",
        unit: "kg",
        higherIsBetter: false,
        benchRecreational: 95,
        benchTrained: 78,
        benchElite: 70,
        displayOrder: 3,
      }),
      tpl({
        metricKey: "bodyFatPercent",
        label: "Gordura corporal",
        unit: "%",
        higherIsBetter: false,
        benchRecreational: 25,
        benchTrained: 18,
        benchElite: 12,
        displayOrder: 4,
      }),
      tpl({
        metricKey: "armCircumferenceCm",
        label: "Circunferência braço",
        unit: "cm",
        higherIsBetter: true,
        benchRecreational: 28,
        benchTrained: 32,
        benchElite: 38,
        displayOrder: 5,
      }),
    ],
  },
  {
    id: "preparador_fisico",
    title: "Preparador físico (esportes)",
    description:
      "Potência e salto vertical: CMJ, RSI, assimetria e salto horizontal.",
    metrics: PREPARADOR_METRICS,
  },
  {
    id: "cross_training",
    title: "Cross training / CrossFit",
    description: "Tempo de WOD, AMRAP, PRs e volume em máquinas (remo/corda).",
    metrics: [
      tpl({
        metricKey: "wodTimeSec",
        label: "Tempo do WOD",
        unit: "s",
        higherIsBetter: false,
        benchRecreational: 1200,
        benchTrained: 900,
        benchElite: 600,
        displayOrder: 0,
      }),
      tpl({
        metricKey: "amrapReps",
        label: "Reps (AMRAP)",
        unit: "nº",
        higherIsBetter: true,
        benchRecreational: 120,
        benchTrained: 200,
        benchElite: 300,
        displayOrder: 1,
      }),
      tpl({
        metricKey: "prLiftKg",
        label: "PR (levantamento)",
        unit: "kg",
        higherIsBetter: true,
        benchRecreational: 40,
        benchTrained: 80,
        benchElite: 140,
        displayOrder: 2,
      }),
      tpl({
        metricKey: "rowingCalories",
        label: "Calorias (remo)",
        unit: "kcal",
        higherIsBetter: true,
        benchRecreational: 40,
        benchTrained: 60,
        benchElite: 85,
        displayOrder: 3,
      }),
      tpl({
        metricKey: "skipReps",
        label: "Reps corda / duplas",
        unit: "nº",
        higherIsBetter: true,
        benchRecreational: 50,
        benchTrained: 120,
        benchElite: 200,
        displayOrder: 4,
      }),
    ],
  },
  {
    id: "running_coach",
    title: "Coach de corrida",
    description:
      `Distância, ritmo (${RUNNING_PACE_NOTE}) e frequência cardíaca.`,
    metrics: [
      tpl({
        metricKey: "distanceKm",
        label: "Distância",
        unit: "km",
        higherIsBetter: true,
        benchRecreational: 3,
        benchTrained: 10,
        benchElite: 42,
        displayOrder: 0,
      }),
      tpl({
        metricKey: "paceMinPerKm",
        label: "Ritmo (min/km decimal)",
        unit: "min/km",
        higherIsBetter: false,
        benchRecreational: 7.5,
        benchTrained: 5.5,
        benchElite: 4.2,
        displayOrder: 1,
      }),
      tpl({
        metricKey: "avgHeartRateBpm",
        label: "FC média",
        unit: "bpm",
        higherIsBetter: false,
        benchRecreational: 165,
        benchTrained: 155,
        benchElite: 145,
        displayOrder: 2,
      }),
      tpl({
        metricKey: "maxHeartRateBpm",
        label: "FC máx",
        unit: "bpm",
        higherIsBetter: true,
        benchRecreational: 170,
        benchTrained: 185,
        benchElite: 195,
        displayOrder: 3,
      }),
      tpl({
        metricKey: "cadenceSpm",
        label: "Cadência",
        unit: "rpm",
        higherIsBetter: true,
        benchRecreational: 160,
        benchTrained: 175,
        benchElite: 190,
        displayOrder: 4,
      }),
    ],
  },
  {
    id: "online_personal_trainer",
    title: "Personal trainer online",
    description:
      "Adesão remota, check-ins e percepção subjetiva para acompanhar quem treina longe.",
    metrics: [
      tpl({
        metricKey: "weeklyCompliancePercent",
        label: "Adesão semanal",
        unit: "%",
        higherIsBetter: true,
        benchRecreational: 40,
        benchTrained: 75,
        benchElite: 95,
        displayOrder: 0,
      }),
      tpl({
        metricKey: "remoteCheckInsCount",
        label: "Check-ins na semana",
        unit: "nº",
        higherIsBetter: true,
        benchRecreational: 1,
        benchTrained: 3,
        benchElite: 5,
        displayOrder: 1,
      }),
      tpl({
        metricKey: "subjectiveEnergy1to10",
        label: "Energia percebida",
        unit: "/10",
        higherIsBetter: true,
        benchRecreational: 4,
        benchTrained: 7,
        benchElite: 9,
        displayOrder: 2,
      }),
      tpl({
        metricKey: "habitStreakDays",
        label: "Sequência de dias (hábito)",
        unit: "dias",
        higherIsBetter: true,
        benchRecreational: 3,
        benchTrained: 14,
        benchElite: 60,
        displayOrder: 3,
      }),
    ],
  },
];

const TEMPLATE_BY_ID: Record<string, MetricTemplateDefinition> = Object.fromEntries(
  METRIC_TEMPLATES.map((t) => [t.id, t])
);

export function getMetricTemplateById(id: string): MetricTemplateDefinition | null {
  return TEMPLATE_BY_ID[id] ?? null;
}

/** Lista leve para o modal de modalidade no dashboard (sem payloads de métricas). */
export const MODALITY_PICKER_OPTIONS = METRIC_TEMPLATES.map(({ id, title, description }) => ({
  id,
  title,
  description,
}));
