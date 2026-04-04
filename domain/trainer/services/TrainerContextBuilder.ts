import { TrainerProfile, ResolvedMetricConfig, StudentGoal } from "@/lib/types";

export function buildTrainerContext(profile: TrainerProfile | null): string {
  if (!profile) return "";

  const parts: string[] = [];
  if (profile.coachingPhilosophy?.trim())
    parts.push(
      `FILOSOFIA DE TREINAMENTO DO PREPARADOR:\n${profile.coachingPhilosophy}`
    );
  if (profile.sportContext?.trim())
    parts.push(`CONTEXTO ESPORTIVO PRINCIPAL:\n${profile.sportContext}`);
  if (profile.athleteProfiles?.trim())
    parts.push(
      `PERFIL TÍPICO DOS ATLETAS ATENDIDOS:\n${profile.athleteProfiles}`
    );
  if (profile.priorityFocus?.trim())
    parts.push(`FOCO PRIORITÁRIO NA ANÁLISE:\n${profile.priorityFocus}`);
  if (profile.customInstructions?.trim())
    parts.push(`INSTRUÇÕES PERSONALIZADAS:\n${profile.customInstructions}`);

  return parts.join("\n\n");
}

export function buildBenchmarkSection(
  metrics: ResolvedMetricConfig[]
): string {
  const enabled = metrics.filter((m) => m.isEnabled);
  return enabled
    .map((m) => {
      const dir = m.higherIsBetter ? "maior = melhor" : "MENOR = melhor";
      const weightNote =
        m.weight !== 1.0 ? ` [peso: ${m.weight}x]` : "";
      const unit = m.unit || "adimensional";
      return (
        `${m.label} (${unit}, ${dir})${weightNote}: ` +
        `Recreativo=${m.benchRecreational}, Treinado=${m.benchTrained}, Elite=${m.benchElite}`
      );
    })
    .join("\n");
}

/**
 * Builds a section describing the athlete's goals so the AI can tailor
 * prescriptions and objectiveAlignment scores to real targets.
 */
export function buildGoalsSection(
  goals: StudentGoal[],
  latestMetricValues: Record<string, number | null>,
  metrics: ResolvedMetricConfig[],
): string {
  if (goals.length === 0) return "";

  const metricsMap: Record<string, ResolvedMetricConfig> = {};
  for (const m of metrics) metricsMap[m.key] = m;

  const lines = goals
    .map((g) => {
      const m = metricsMap[g.metricKey];
      const label = m?.label ?? g.metricKey;
      const unit = m?.unit ? ` ${m.unit}` : "";
      const currentRaw = latestMetricValues[g.metricKey];
      const current = currentRaw !== null && currentRaw !== undefined ? currentRaw : null;

      let progressNote = "";
      if (current !== null) {
        const higherIsBetter = m?.higherIsBetter ?? true;
        const pct = higherIsBetter
          ? Math.round((current / g.targetValue) * 100)
          : Math.round((g.targetValue / current) * 100);
        progressNote = ` — atual: ${current}${unit} (${Math.min(pct, 100)}% da meta)`;
      }

      const deadline = g.targetDate
        ? ` | prazo: ${new Date(g.targetDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`
        : "";

      return `  - ${label}: atingir ${g.targetValue}${unit}${deadline}${progressNote}`;
    })
    .join("\n");

  return `METAS DEFINIDAS PELO PREPARADOR PARA ESTE ATLETA:\n${lines}\n\nAo calcular objectiveAlignment.score e redigir as prescrições, leve em conta o progresso atual rumo a essas metas.`;
}

export function buildWeightNote(metrics: ResolvedMetricConfig[]): string {
  const weighted = metrics.filter((m) => m.isEnabled && m.weight !== 1.0);
  if (weighted.length === 0) return "";
  const list = weighted.map((m) => `${m.label} (${m.weight}x)`).join(", ");
  return (
    `\nPONDERAÇÃO DO ESCORE GERAL: O preparador definiu pesos especiais. ` +
    `Ao calcular o performanceScore, dê mais peso às seguintes métricas: ${list}. ` +
    `Métricas com peso 0 não contribuem para o escore geral.`
  );
}
