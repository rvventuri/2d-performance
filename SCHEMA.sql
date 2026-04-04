-- ============================================================
-- 2D Performance — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- 1. TABELA: students
-- ============================================================
CREATE TABLE public.students (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  age             INTEGER,
  weight          NUMERIC(5,1),
  height          NUMERIC(5,1),
  objective       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA: assessments
-- Métricas de salto desnormalizadas em colunas para facilitar queries e gráficos
-- ============================================================
CREATE TABLE public.assessments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  DATE        NOT NULL,

  -- Saltos bilaterais
  cmj                   NUMERIC(6,2),   -- Countermovement Jump (cm)
  sj                    NUMERIC(6,2),   -- Squat Jump (cm)
  abalakov              NUMERIC(6,2),   -- Abalakov (cm)

  -- Reatividade
  rsi                   NUMERIC(5,3),   -- Reactive Strength Index
  tempo_contato         NUMERIC(6,1),   -- Tempo de Contato (ms)
  altura_salto_dj       NUMERIC(6,2),   -- Altura Salto Drop Jump (cm)

  -- Assimetria unilateral
  cmj_esquerdo          NUMERIC(6,2),   -- CMJ membro esquerdo (cm)
  cmj_direito           NUMERIC(6,2),   -- CMJ membro direito (cm)
  assimetria_percentual NUMERIC(5,2),   -- Assimetria percentual (%)

  -- Potência horizontal
  salto_horizontal      NUMERIC(6,1),   -- Salto Horizontal (cm)

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY — cada usuário vê só seus dados
-- ============================================================
ALTER TABLE public.students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Students: CRUD apenas do próprio usuário
CREATE POLICY "students_owner" ON public.students
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Assessments: CRUD apenas do próprio usuário
CREATE POLICY "assessments_owner" ON public.assessments
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX idx_students_user_id
  ON public.students(user_id);

CREATE INDEX idx_assessments_student_id
  ON public.assessments(student_id);

CREATE INDEX idx_assessments_user_id
  ON public.assessments(user_id);

CREATE INDEX idx_assessments_date
  ON public.assessments(student_id, date ASC);

-- ============================================================
-- 5. TABELA: ai_analyses
-- Armazena o resultado da análise de IA por atleta
-- Uma análise por atleta, regenerada apenas quando há nova avaliação
-- ============================================================
CREATE TABLE public.ai_analyses (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content              TEXT        NOT NULL,
  last_assessment_id   UUID        REFERENCES public.assessments(id) ON DELETE SET NULL,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_analyses_owner" ON public.ai_analyses
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_analyses_student_id
  ON public.ai_analyses(student_id);

-- ============================================================
-- ESTRUTURA RESUMIDA
--
-- auth.users (gerenciado pelo Supabase Auth)
--   └── id (UUID)
--   └── email
--
-- students
--   └── id          UUID PK
--   └── user_id     UUID FK → auth.users
--   └── name        TEXT
--   └── age         INTEGER
--   └── weight      NUMERIC
--   └── height      NUMERIC
--   └── objective   TEXT
--   └── created_at  TIMESTAMPTZ
--
-- assessments
--   └── id                    UUID PK
--   └── student_id            UUID FK → students
--   └── user_id               UUID FK → auth.users
--   └── date                  DATE
--   └── cmj                   NUMERIC
--   └── sj                    NUMERIC
--   └── abalakov              NUMERIC
--   └── rsi                   NUMERIC
--   └── tempo_contato         NUMERIC
--   └── altura_salto_dj       NUMERIC
--   └── cmj_esquerdo          NUMERIC
--   └── cmj_direito           NUMERIC
--   └── assimetria_percentual NUMERIC
--   └── salto_horizontal      NUMERIC
--   └── created_at            TIMESTAMPTZ
--
-- ai_analyses
--   └── id                   UUID PK
--   └── student_id           UUID FK → students
--   └── user_id              UUID FK → auth.users
--   └── content              TEXT
--   └── last_assessment_id   UUID FK → assessments (nullable)
--   └── generated_at         TIMESTAMPTZ
--
-- trainer_profiles
--   └── id                   UUID PK
--   └── user_id              UUID FK → auth.users (UNIQUE)
--   └── coaching_philosophy  TEXT
--   └── sport_context        TEXT
--   └── athlete_profiles     TEXT
--   └── priority_focus       TEXT
--   └── custom_instructions  TEXT
--   └── updated_at           TIMESTAMPTZ
--
-- metric_configs
--   └── id                   UUID PK
--   └── user_id              UUID FK → auth.users
--   └── metric_key           TEXT (UNIQUE per user)
--   └── label                TEXT
--   └── unit                 TEXT
--   └── higher_is_better     BOOLEAN
--   └── is_custom            BOOLEAN
--   └── is_enabled           BOOLEAN
--   └── bench_recreational   NUMERIC (nullable = usar default)
--   └── bench_trained        NUMERIC (nullable)
--   └── bench_elite          NUMERIC (nullable)
--   └── weight               NUMERIC 0-3 (1.0 = normal)
--   └── display_order        INTEGER
--   └── created_at           TIMESTAMPTZ
--
-- custom_metric_values
--   └── id                   UUID PK
--   └── assessment_id        UUID FK → assessments
--   └── user_id              UUID FK → auth.users
--   └── metric_key           TEXT
--   └── value                NUMERIC
-- ============================================================

-- ============================================================
-- 4. TABELA: trainer_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trainer_profiles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coaching_philosophy TEXT,
  sport_context       TEXT,
  athlete_profiles    TEXT,
  priority_focus      TEXT,
  custom_instructions TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_profiles_owner" ON public.trainer_profiles
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id
  ON public.trainer_profiles(user_id);

-- ============================================================
-- 5. TABELA: metric_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metric_configs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_key          TEXT        NOT NULL,
  label               TEXT        NOT NULL,
  unit                TEXT        NOT NULL DEFAULT '',
  higher_is_better    BOOLEAN     NOT NULL DEFAULT TRUE,
  is_custom           BOOLEAN     NOT NULL DEFAULT FALSE,
  is_enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
  bench_recreational  NUMERIC(8,3),
  bench_trained       NUMERIC(8,3),
  bench_elite         NUMERIC(8,3),
  weight              NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  display_order       INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, metric_key)
);

ALTER TABLE public.metric_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metric_configs_owner" ON public.metric_configs
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_metric_configs_user_id
  ON public.metric_configs(user_id);

-- ============================================================
-- 6. TABELA: custom_metric_values
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_metric_values (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID        NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_key    TEXT        NOT NULL,
  value         NUMERIC(10,4),
  UNIQUE (assessment_id, metric_key)
);

ALTER TABLE public.custom_metric_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_metric_values_owner" ON public.custom_metric_values
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_metric_values_assessment_id
  ON public.custom_metric_values(assessment_id);

CREATE INDEX IF NOT EXISTS idx_custom_metric_values_user_id
  ON public.custom_metric_values(user_id);

-- ============================================================
-- MIGRAÇÃO: Links de compartilhamento com atleta
-- Execute no SQL Editor do Supabase caso o schema já exista.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.share_links (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token         TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, user_id)
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_links_owner" ON public.share_links
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_share_links_token
  ON public.share_links(token);

CREATE INDEX IF NOT EXISTS idx_share_links_student_id
  ON public.share_links(student_id);

-- ============================================================
-- MIGRAÇÃO: Metas por Atleta
-- Execute no SQL Editor do Supabase caso o schema já exista.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_goals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  metric_key   TEXT        NOT NULL,
  target_value NUMERIC(10,4) NOT NULL,
  target_date  DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, metric_key)
);

ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_goals_owner" ON public.student_goals
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_student_goals_student_id
  ON public.student_goals(student_id);

CREATE INDEX IF NOT EXISTS idx_student_goals_user_id
  ON public.student_goals(user_id);

-- ============================================================
-- MIGRAÇÃO: Background AI Analysis — status e Realtime
-- Execute no SQL Editor do Supabase caso o schema já exista.
-- ============================================================

-- 1. Coluna de status da análise
ALTER TABLE public.ai_analyses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'done';

-- 2. Habilita Realtime na tabela para o AiAnalysisTab escutar mudanças
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_analyses;

-- ============================================================
-- MIGRAÇÃO: Foto do atleta
-- Execute os blocos abaixo no SQL Editor do Supabase caso o
-- schema já tenha sido criado anteriormente.
-- ============================================================

-- 1. Coluna na tabela students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Bucket de armazenamento de fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-photos', 'athlete-photos', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRAÇÃO: AI Usage Monitoring — duração e tokens
-- Execute no SQL Editor do Supabase caso o schema já exista.
-- ============================================================

ALTER TABLE public.ai_analyses
  ADD COLUMN IF NOT EXISTS duration_ms   INTEGER,
  ADD COLUMN IF NOT EXISTS input_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER;

-- 3. Políticas RLS do bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'athlete_photos_insert'
  ) THEN
    CREATE POLICY "athlete_photos_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'athlete-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'athlete_photos_update'
  ) THEN
    CREATE POLICY "athlete_photos_update"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'athlete-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'athlete_photos_delete'
  ) THEN
    CREATE POLICY "athlete_photos_delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'athlete-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'athlete_photos_public_read'
  ) THEN
    CREATE POLICY "athlete_photos_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'athlete-photos');
  END IF;
END $$;
