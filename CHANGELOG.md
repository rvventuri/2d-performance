# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

---

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
