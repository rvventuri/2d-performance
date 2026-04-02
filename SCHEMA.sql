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
-- ============================================================
