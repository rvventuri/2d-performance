/**
 * Manual row-level types matching SCHEMA.sql.
 *
 * Replace with generated types once `supabase gen types typescript` is added
 * to the CI pipeline:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 */

export interface StudentRow {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  objective: string | null;
  photo_url: string | null;
  /** Presente após migração de dados de demonstração; ausente em projetos legados até rodar SCHEMA.sql. */
  is_demo?: boolean;
  created_at: string;
}

export interface UserDemoStateRow {
  user_id: string;
  template_version: number;
  applied_at: string;
  cleared_at: string | null;
}

export interface AssessmentRow {
  id: string;
  student_id: string;
  user_id: string;
  date: string;
  cmj: number | null;
  sj: number | null;
  abalakov: number | null;
  rsi: number | null;
  tempo_contato: number | null;
  altura_salto_dj: number | null;
  cmj_esquerdo: number | null;
  cmj_direito: number | null;
  assimetria_percentual: number | null;
  salto_horizontal: number | null;
  created_at: string;
}

export interface CustomMetricValueRow {
  id: string;
  assessment_id: string;
  user_id: string;
  metric_key: string;
  value: number | null;
}

export interface AiAnalysisRow {
  id: string;
  student_id: string;
  user_id: string;
  content: string;
  last_assessment_id: string | null;
  generated_at: string;
  status: string; // 'pending' | 'running' | 'done' | 'error'
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface TrainerProfileRow {
  id: string;
  user_id: string;
  coaching_philosophy: string | null;
  sport_context: string | null;
  athlete_profiles: string | null;
  priority_focus: string | null;
  custom_instructions: string | null;
  updated_at: string;
}

export interface MetricConfigRow {
  id: string;
  user_id: string;
  metric_key: string;
  label: string;
  unit: string | null;
  higher_is_better: boolean;
  is_custom: boolean;
  is_enabled: boolean;
  bench_recreational: number | null;
  bench_trained: number | null;
  bench_elite: number | null;
  weight: number;
  display_order: number | null;
  created_at: string;
}

export interface ShareLinkRow {
  id: string;
  student_id: string;
  user_id: string;
  token: string;
  password_hash: string | null;
  created_at: string;
}

export interface StudentGoalRow {
  id: string;
  student_id: string;
  user_id: string;
  metric_key: string;
  target_value: number;
  target_date: string | null;
  created_at: string;
}
