/**
 * Um usuário Supabase Auth por template, cada um com alunos/avaliações demo alinhados às métricas do template.
 * Variáveis opcionais: se ausentes, aplicamos só o template de métricas (sem clone de alunos).
 *
 * Compat: `DEMO_TEMPLATE_USER_ID` continua como fallback para preparador_fisico.
 */
const BY_TEMPLATE: Record<string, string | undefined> = {
  personal_trainer_strength: process.env.DEMO_TEMPLATE_USER_PERSONAL_TRAINER_STRENGTH,
  preparador_fisico:
    process.env.DEMO_TEMPLATE_USER_PREPARADOR_FISICO ?? process.env.DEMO_TEMPLATE_USER_ID,
  cross_training: process.env.DEMO_TEMPLATE_USER_CROSS_TRAINING,
  running_coach: process.env.DEMO_TEMPLATE_USER_RUNNING_COACH,
  online_personal_trainer: process.env.DEMO_TEMPLATE_USER_ONLINE_PT,
};

export function getDemoSeedUserIdForTemplate(templateId: string): string | undefined {
  const v = BY_TEMPLATE[templateId]?.trim();
  return v || undefined;
}
