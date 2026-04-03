import { TrainerProfile, ResolvedMetricConfig } from "@/lib/types";

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
