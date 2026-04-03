<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 2D Performance — Contexto do Projeto

## O que é este app

SaaS para **personal trainers** acompanharem a **performance de salto** dos seus atletas. O trainer cadastra alunos, registra avaliações com métricas de salto (CMJ, SJ, Abalakov, RSI, etc.) e consulta análises geradas por IA (Claude) que interpretam a evolução e sugerem intervenções.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base UI + CVA) |
| Banco/Auth | Supabase (Postgres + Auth + Storage + Realtime) |
| IA | `@anthropic-ai/sdk` — Claude Sonnet |
| Charts | Recharts |
| Testes | Vitest 4 + Testing Library + jsdom |
| Linguagem | TypeScript 5 strict |

## Arquitetura em Camadas (DDD)

```
domain/           → interfaces, value objects, serviços de domínio puros (sem I/O)
application/      → use cases (orquestram repositórios, sem lógica de UI)
infrastructure/   → implementações Supabase dos repositórios
app/              → Next.js pages, API routes, Server Actions
components/       → UI components (features e primitivos)
lib/              → utilitários compartilhados, clientes Supabase, tipos
```

**Regra:** lógica de negócio fica em `domain/` e `application/`. Nunca em `app/` ou `components/`.

### Exemplo de fluxo para nova feature

1. Interface em `domain/X/repositories/IX.ts`
2. Use case em `application/X/XUseCase.ts`
3. Implementação em `infrastructure/supabase/XRepository.ts`
4. Consumo em Server Component ou Server Action em `app/`

## Clientes Supabase

| Arquivo | Quando usar |
|---|---|
| `lib/supabase/server.ts` → `createClient()` | Server Components, API routes, Server Actions |
| `lib/supabase/client.ts` → `createClient()` | Client Components (browser) |
| `lib/supabase/admin.ts` → `createAdminClient()` | Operações privilegiadas (service role) — nunca em rotas públicas |

## Banco de Dados (tabelas principais)

| Tabela | Propósito |
|---|---|
| `students` | Perfis de atletas (FK → auth.users) |
| `assessments` | Avaliações com métricas de salto denormalizadas em colunas |
| `custom_metric_values` | Métricas extras por avaliação (metric_key + value) |
| `ai_analyses` | Análises de IA por atleta; `status` = pending/running/done/error |
| `trainer_profiles` | Contexto do trainer para personalizar prompts de IA |
| `metric_configs` | Configurações de métricas por trainer (benchmarks, pesos, labels) |
| `share_links` | Links de compartilhamento público de atletas (token + password opcional) |

Toda tabela tem RLS com `auth.uid() = user_id`. Schema em `SCHEMA.sql`.

## Convenções de Nomenclatura

- **App (TypeScript):** `camelCase` para propriedades (`studentId`, `photoUrl`, `metricKey`)
- **Banco (Postgres):** `snake_case` para colunas (`student_id`, `photo_url`, `metric_key`)
- **Mappers:** ficam em `infrastructure/supabase/` — convertem `snake_case` rows → entidades `camelCase`
- **Tipos do banco:** `lib/supabase/database.types.ts` (sufixo `Row` para tipos de linha, ex: `StudentRow`)
- **Tipos de domínio:** `lib/types.ts`

## Respostas de API

Sempre usar os helpers de `lib/api.ts`:

```typescript
import { apiOk, apiError } from "@/lib/api";

return apiOk(data);          // { data: T }
return apiError("msg", 401); // { error: string }
```

## Comandos de Desenvolvimento

```bash
npm run dev          # servidor de desenvolvimento
npm test             # testes (vitest run)
npm run test:watch   # testes em watch mode
npm run test:coverage # cobertura (domain/, application/, infrastructure/)
npm run lint         # eslint
npm run build        # build de produção
```

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL   (opcional, fallback: request origin)
```

## Arquivos Importantes

| Arquivo | Propósito |
|---|---|
| `lib/types.ts` | Tipos de domínio (Student, Assessment, AiAnalysisData, etc.) |
| `lib/supabase/database.types.ts` | Tipos das rows do banco |
| `lib/api.ts` | Helpers `apiOk` / `apiError` |
| `domain/trainer/services/MetricConfigResolver.ts` | Merge defaults + overrides do trainer |
| `domain/trainer/services/TrainerContextBuilder.ts` | Monta contexto do trainer para prompts IA |
| `lib/services/ai-analysis.service.ts` | Integração com Anthropic |
| `proxy.ts` | Middleware de auth (pendente de virar `middleware.ts`) |
| `SCHEMA.sql` | Schema completo do banco (fonte de verdade) |
