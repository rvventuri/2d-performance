# SaltoVerse — pitch do produto

**Uma linha:** plataforma para **profissionais de performance** acompanharem **alunos**, **métricas** e **evolução** — com **análises em IA** que transformam dados em decisões de treino.

**Tagline (código):** ver `APP_TAGLINE` em `lib/branding.ts` — *SaltoVerse — performance tracking com IA para quem acompanha evolução de verdade.*

---

## O problema

Quem acompanha alunos costuma **coletar dados** em planilhas, apps e anotações. No fim:

- fica difícil ver **evolução real** ao longo do tempo;
- **análise manual** consome horas ou não acontece;
- há **incerteza** na hora de ajustar o treino.

Ou seja: há dados, mas falta **clareza**.

## O que estamos construindo

O **SaltoVerse** **centraliza** cadastro, avaliações e visualização — e adiciona **IA** que interpreta histórico, contexto de treino e métricas configuradas para entregar leitura, padrões e sugestões **acionáveis**.

No código, o núcleo forte continua sendo **métricas de salto** (CMJ, SJ, Abalakov, RSI, etc.) **mais** `custom_metric_values` e `metric_configs`; o **marketing** fala em templates (força, corrida, salto…) e métricas próprias, alinhado ao roadmap de mensagem.

---

## Para quem é

- Treinadores pessoais, preparadores físicos, fisioterapeutas, coaches de corrida e **profissionais de performance** que acompanham evolução de pessoas.
- Quem quer **histórico confiável**, gráficos claros e **IA como assistente de análise**, não só dashboard.

---

## Funcionalidades (o que o produto entrega)

| Área | O que faz |
|------|-----------|
| **Alunos** | Cadastro e perfil; acompanhamento individual. |
| **Avaliações** | Sessões com métricas de salto (e afins) nas colunas principais + **métricas custom** por avaliação. |
| **Visualização** | Gráficos e evolução ao longo do tempo (Recharts). |
| **Configuração do trainer** | Perfil e **metric_configs** (benchmarks, pesos, labels) que alimentam contexto das análises. |
| **IA (Claude)** | Análises por aluno: evolução, insights e sugestões — com status (pendente / em execução / concluída / erro) e atualização em tempo quase real na UI. |
| **Compartilhamento** | Links públicos opcionais (senha opcional) para mostrar evolução a alunos ou equipe sem acesso à conta inteira. |
| **Onboarding** | Base de demonstração para novas contas (quando `DEMO_TEMPLATE_USER_ID` está configurado). |

---

## Por que IA aqui faz diferença

A IA **não substitui** o profissional — acelera a leitura de séries longas, destaca padrões e ajuda a estruturar próximos passos. O prompt usa **perfil do trainer** e **métricas escolhidas**, coerente com a forma como cada um trabalha.

---

## Confiança e operação

- Dados isolados por conta (**RLS** no Postgres / Supabase).
- Autenticação moderna (incluindo OAuth onde aplicável).
- Stack: **Next.js (App Router)**, **React**, **Supabase**, **Anthropic (Claude)** — SaaS enxuto e escalável.

---

## Em uma frase (elevator pitch)

> **SaltoVerse** é onde você **acompanha alunos com clareza**: métricas e histórico em um lugar, **IA** que interpreta evolução e sugere ajustes — **sem** abrir mão do seu critério profissional.

---

*Documento interno — alinhado a `lib/branding.ts`, `AGENTS.md` e à landing em `app/(marketing)/page.tsx`.*
