<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 2D Performance — Contexto do Projeto

## O que é este app

**SaltoVerse** — SaaS para **profissionais de performance** (treinadores, preparadores, fisioterapeutas, etc.) **acompanharem alunos**: métricas, histórico de avaliações e evolução visual, com **análises geradas por IA** (Claude Sonnet via `@anthropic-ai/sdk`) que interpretam dados e sugerem leituras e ajustes de treino.

**Posicionamento (marketing e copy):** mensagem ampla — clareza, decisão baseada em dados e IA acionável. Textos canônicos em `lib/branding.ts` (`APP_DESCRIPTION`, `APP_TAGLINE`). Landing pública em `app/(marketing)/page.tsx`. Pitch interno resumido em `PITCH.md`.

**Âmbito do código hoje:** o banco e a UI ainda **destacam métricas de salto** (CMJ, SJ, Abalakov, RSI, assimetria, etc.) em colunas de `assessments`, além de **`custom_metric_values`** e **`metric_configs`** para métricas e benchmarks por trainer — compatível com o discurso de templates + métricas próprias.

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

### Login com Google (OAuth) e links em redes sociais

No **celular**, apps como LinkedIn ou Instagram abrem links em **WebView**; o Google costuma **bloquear** OAuth nesse contexto. As telas de login e cadastro mostram um **aviso fechável** (persistido na sessão com `sessionStorage`) com links para abrir a URL canônica no navegador (HTTPS em nova janela, Safari, Chrome iOS ou intent Android). O login **não** é bloqueado pelo aviso. Defina **`NEXT_PUBLIC_APP_URL=https://2d-performance.vercel.app`** (sem barra final) na Vercel para que esses links não dependam do host do WebView.

Na **landing** (`app/(marketing)/page.tsx`), CTAs de entrar/cadastrar usam `getMarketingCtaHref` + `target="_blank"` para tentar abrir fora do WebView de apps sociais. **Não é garantido** (quem decide é o app anfitrião); sem API web para “forçar navegador padrão”.

**Diagnóstico rápido:** no mesmo telefone, abrir o mesmo URL no **Safari** ou **Chrome** (fora do app) e tentar de novo. Se funcionar, era WebView — não é bug de redirect no Next.js.

**Se o erro mencionar redirect / URI e ocorrer em qualquer dispositivo:**

1. **Supabase** → Authentication → URL configuration: **Site URL** = URL canônica de produção; **Redirect URLs** deve incluir `https://<seu-dominio>/auth/callback` (e variante `www` se existir).
2. **Google Cloud Console** → Credenciais → OAuth 2.0 Client ID usado pelo Supabase: **URIs de redirecionamento autorizados** deve incluir `https://<project-ref>.supabase.co/auth/v1/callback` (redirect do Google vai primeiro para o domínio do Supabase, não para `/auth/callback` do app).

## Banco de Dados (tabelas principais)

| Tabela | Propósito |
|---|---|
| `students` | Perfis de alunos / atletas (FK → auth.users) |
| `assessments` | Avaliações com métricas de salto (e afins) denormalizadas em colunas + extensão via custom |
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
NEXT_PUBLIC_APP_URL   (recomendado em produção: URL canônica, ex. https://2d-performance.vercel.app — usada nos links “Abrir no Chrome/Safari” no login; fallback: origin atual)
NEXT_PUBLIC_GA_MEASUREMENT_ID (opcional) — ID GA4 (ex. G-XXXXXXXXXX); sem valor, o script e eventos `gtag` não carregam
Dados de demonstração por modalidade (opcional) — no primeiro acesso ao dashboard o trainer escolhe a modalidade; o app aplica o template de métricas e, se houver UUID configurado para essa modalidade, clona alunos/avaliações desse usuário seed. Requer `SUPABASE_SERVICE_ROLE_KEY` no servidor para o clone.
`DEMO_TEMPLATE_USER_PREPARADOR_FISICO` ou legado `DEMO_TEMPLATE_USER_ID` — seed alinhado ao template preparador (salto).
`DEMO_TEMPLATE_USER_PERSONAL_TRAINER_STRENGTH`, `DEMO_TEMPLATE_USER_CROSS_TRAINING`, `DEMO_TEMPLATE_USER_RUNNING_COACH`, `DEMO_TEMPLATE_USER_ONLINE_PT` — um Auth user por modalidade (opcionais).
```

## SEO (produção)

- **Search Console**:
  - Adicionar a propriedade do domínio/URL de produção (ex.: `https://2d-performance.vercel.app` ou domínio próprio).
  - Verificar propriedade (DNS para domínio ou meta tag/HTML para URL-prefix).
  - Enviar sitemap: `https://<seu-dominio>/sitemap.xml` (o app gera via `app/sitemap.ts`).
  - Checar: Cobertura/Indexação, Sitemaps, Experiência → Core Web Vitals.
  - Após mudanças de metadata/robots, usar “Inspecionar URL” → “Solicitar indexação” na home.

**Observação:** páginas autenticadas e `/share/*` ficam com `noindex`/`nofollow` (layouts) e/ou `disallow` em `robots.txt`.

### Dados de demonstração (onboarding)

1. Para cada modalidade em que quiser demo com alunos fictícios, crie um usuário interno no Supabase Auth, faça login e popule alunos `is_demo`, avaliações (colunas de salto e/ou `custom_metric_values` conforme o template) e análises de IA.
2. Copie cada UUID para a variável de ambiente correspondente (`lib/demo-seed-users.ts` lista os nomes).
3. Execute no SQL Editor os trechos de `SCHEMA.sql` (`user_demo_state` com `modality_chosen_at`, políticas RLS, etc.).

Sem UUID para uma modalidade, ao escolhê-la o trainer recebe só o template de métricas (sem clone de alunos).

## Arquivos Importantes

| Arquivo | Propósito |
|---|---|
| `lib/branding.ts` | Nome do produto e mensagens canônicas (`APP_NAME`, `APP_DESCRIPTION`, `APP_TAGLINE`) — SEO, JSON-LD, login/register, landing |
| `lib/types.ts` | Tipos de domínio (Student, Assessment, AiAnalysisData, etc.) |
| `lib/supabase/database.types.ts` | Tipos das rows do banco |
| `lib/api.ts` | Helpers `apiOk` / `apiError` |
| `domain/trainer/services/MetricConfigResolver.ts` | Merge defaults + overrides do trainer |
| `domain/trainer/services/TrainerContextBuilder.ts` | Monta contexto do trainer para prompts IA |
| `lib/services/ai-analysis.service.ts` | Integração com Anthropic |
| `proxy.ts` | Middleware de auth (pendente de virar `middleware.ts`) |
| `SCHEMA.sql` | Schema completo do banco (fonte de verdade) |
