# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

---

## [Unreleased] — 2026-04-04

### Added
- **Metas por atleta**: tabela `student_goals` no `SCHEMA.sql` (RLS, upsert por `student_id` + `metric_key`); repositório, use cases e server actions em `app/students/[id]/_actions.ts`; na aba Gráficos do atleta, ícone de meta abre dialog para valor alvo e prazo opcional, linha de referência no `MetricChart` e barra de progresso
- **Metas no prompt da IA**: `buildGoalsSection` em `TrainerContextBuilder` e carregamento de metas em `POST /api/analyze-athlete`, análise em background e `runAnalysis` / `streamAnalysis`
- **Onboarding guiado**: card "Primeiros passos" no dashboard com checklist (perfil IA, primeiro atleta, primeira avaliação), progresso derivado do banco e dismiss persistido em `localStorage` via `useSyncExternalStore`

### Fixed
- `lib/services/ai-analysis.service.ts`: `goalsContext` calculado após `buildGoalsSection` para evitar referência antes da inicialização em runtime
- `OnboardingChecklist`: substituição de `useEffect` + `setState` por `useSyncExternalStore` (compatível com regra `react-hooks/set-state-in-effect`)

---

## [Unreleased] — 2026-04-03 (2)

### Added
- **Painel Admin**: nova seção `/admin` com métricas de uso da plataforma (trainers, alunos, avaliações, análises de IA por status, top trainers), acessível apenas a usuários com `app_metadata.is_admin = true`
- **Proteção de rota Admin**: `proxy.ts` redireciona para `/dashboard` usuários sem flag de admin ao tentar acessar `/admin`
- **Link Admin na Navbar**: ícone de escudo aparece apenas para administradores; estado ativo sincronizado com pathname
- **Monitoramento de uso da IA**: colunas `duration_ms`, `input_tokens` e `output_tokens` adicionadas à tabela `ai_analyses`; valores capturados e persistidos nas rotas `POST /api/analyze-athlete` e na Server Action de avaliação
- **Tipos de domínio Admin**: interfaces `AdminTrainerStat`, `AiUsageStats` e `AdminMetrics` em `lib/types.ts`
- **Repositório e Use Cases Admin**: `domain/admin/`, `application/admin/` e `infrastructure/supabase/AdminRepository.ts` seguindo a arquitetura DDD
- Endpoint de desenvolvimento `/api/dev/make-admin` para promover usuários a admin em ambiente local

### Changed
- `components/analysis-loading.tsx`: pipeline de estágios redesenhado de grade horizontal para **stepper vertical** com ícone `CheckCircle2` nos estágios concluídos e conector animado entre etapas; estado `prevStage` e variável `stage`/`Icon` redundantes removidos
- `lib/services/ai-analysis.service.ts`: `streamAnalysis` agora retorna `AnalysisResult` (com métricas de uso) em vez de `AiAnalysisData` diretamente; `runAnalysis` enriquecido com `durationMs`, `inputTokens` e `outputTokens`

## [Unreleased] — 2026-04-03

### Added
- QA Agent: regra Cursor (`.cursor/rules/qa-agent.mdc`) que roda lint, testes, gera CHANGELOG e faz commit+push ao ser invocado
- `CHANGELOG.md` com estrutura Keep a Changelog para documentar releases
- `qa-error-report.md` adicionado ao `.gitignore` (relatório de falha local, nunca vai ao repo)
- Contexto expandido no `AGENTS.md` com stack, arquitetura DDD, convenções, tabelas do banco e arquivos importantes

### Fixed
- `app/page.tsx`: desestruturação do hook `useInView` nos 7 pontos de chamada para satisfazer a regra `react-hooks/refs` do React 19
- `components/navbar.tsx`: substituição do padrão `useState + useEffect` para detecção de client-side pelo `useSyncExternalStore` (React 19 idiomatic)
- `components/analysis-loading.tsx`: inicialização de `Date.now()` movida para `useState` com lazy initializer, eliminando chamada de função impura durante render
- `app/share/[token]/page.tsx`: `fetchData` não chama mais `setPhase("loading")` de forma síncrona; call site do useEffect usa IIFE assíncrona explícita

---

## [0.1.0] — 2026-04-03

### Added
- Setup inicial do projeto: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui
- Autenticação de trainers via Supabase Auth
- Cadastro e listagem de alunos com foto (Supabase Storage)
- Registro de avaliações com métricas de salto: CMJ, SJ, Abalakov, RSI
- Métricas customizadas por avaliação (`custom_metric_values`)
- Análises de IA por atleta via Claude Sonnet (status: pending/running/done/error)
- Configuração de métricas por trainer (`metric_configs`) com benchmarks e pesos
- Links de compartilhamento público de atletas (`share_links`) com senha opcional
- Perfil do trainer para personalizar prompts de IA (`trainer_profiles`)
- Arquitetura DDD em camadas: `domain/`, `application/`, `infrastructure/`, `app/`
- Suite de testes com Vitest + Testing Library
- QA Agent para validação e deploy automatizado
