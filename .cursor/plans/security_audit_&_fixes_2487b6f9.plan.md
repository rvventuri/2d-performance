---
name: Security Audit & Fixes
overview: Comprehensive security audit identified 1 critical, 5 high, 5 medium, and 3 low severity issues. No classic SQL injection was found (Supabase query builder is used throughout), but there are significant issues in middleware, XSS, tenant isolation, and open redirects.
todos:
  - id: c1-middleware
    content: Rename proxy.ts → middleware.ts and wire it as real Next.js middleware
    status: pending
  - id: h1-open-redirect
    content: Fix open redirect in app/auth/callback/route.ts — validate 'next' is a relative same-origin path
    status: pending
  - id: h2-xss
    content: Fix XSS in ai-analysis-modal.tsx — HTML-escape captured groups before dangerouslySetInnerHTML
    status: pending
  - id: h3-rls-idor
    content: Tighten RLS WITH CHECK on assessments + ai_analyses to verify student_id ownership, add server-side checks in _actions.ts and analyze-athlete route
    status: pending
  - id: h4-rate-limit-register
    content: Add rate limiting to public registration endpoint
    status: pending
  - id: h5-env-failclosed
    content: Change proxy.ts env-missing branch to fail-closed (throw/500) instead of passing through
    status: pending
  - id: m1-rate-limit-api
    content: Add rate limiting to /api/analyze-athlete and /api/share/[token]
    status: pending
  - id: m2-logs
    content: Remove share token from console.log in app/api/share/route.ts
    status: pending
  - id: m3-upload-mime
    content: Add server-side MIME validation for athlete photo uploads
    status: pending
  - id: m4-csp
    content: Add Content-Security-Policy header in next.config.ts
    status: pending
  - id: m5-errors
    content: Sanitize verbose error messages returned to clients in API routes
    status: pending
isProject: false
---

# Security Audit — 2D Performance

## Overall Risk Profile

- **SQL Injection:** Not present. All DB access uses Supabase PostgREST query builder with bound parameters.
- **npm audit:** 0 known vulnerable dependencies.
- **Main risks:** Middleware not wired, XSS via AI output, cross-tenant RLS gap, open redirect, no rate limiting.

---

## Critical

### C1 — Middleware not wired (`proxy.ts` → no `middleware.ts`)

`[proxy.ts](proxy.ts)` exports `proxy` and `config`, but Next.js only runs edge middleware from a root `middleware.ts` file. **This means the auth middleware never executes.** Application is only protected by individual `getUser()` checks in Server Components and Supabase RLS.

**Fix:** Rename `proxy.ts` to `middleware.ts` and change `export async function proxy` → `export async function middleware`. Verify `config` matcher is correct.

---

## High

### H1 — Open redirect on OAuth callback

`[app/auth/callback/route.ts](app/auth/callback/route.ts)` line 8, 35–36:

```ts
const next = searchParams.get("next") ?? "/dashboard";
return NextResponse.redirect(new URL(next, origin)); // ← resolves external URLs
```

`new URL("https://evil.example", origin)` resolves to `https://evil.example`. An attacker can craft a phishing link that redirects after a legitimate login.

**Fix:** Validate `next` is a relative path:

```ts
const next = searchParams.get("next") ?? "/dashboard";
const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
```

### H2 — XSS via AI output rendered as HTML

`[components/ai-analysis-modal.tsx](components/ai-analysis-modal.tsx)` lines 90–95, 54:
`renderInline()` injects `$1` capture groups directly into HTML via `dangerouslySetInnerHTML` without escaping. If the AI or a prompt injection returns `<script>` or `onerror=` patterns, it executes in the browser.

**Fix:** HTML-escape the captured group before injecting it:

```ts
function escapeHtml(str: string) {
  return str.replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">");
}
// then: '<strong ...>' + escapeHtml(match) + '</strong>'
```

### H3 — RLS cross-tenant integrity gap (IDOR)

`[SCHEMA.sql](SCHEMA.sql)` lines 61–65, 98–101: The `assessments_owner` and `ai_analyses_owner` policies only check `auth.uid() = user_id`, NOT that the referenced `student_id` belongs to the same user.

An authenticated attacker who knows another tenant's `student_id` UUID can INSERT an assessment or AI analysis linked to it.

**Fix (DB):** Tighten RLS WITH CHECK policies:

```sql
-- assessments
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM students WHERE id = student_id AND user_id = auth.uid())
);

-- ai_analyses (same pattern)
```

**Fix (App):** Also add a server-side ownership check in `[app/students/[id]/assessment/_actions.ts](app/students/[id]/assessment/_actions.ts)` and `[app/api/analyze-athlete/route.ts](app/api/analyze-athlete/route.ts)` before inserting.

### H4 — Open public registration with service role, no rate limiting

`[app/api/auth/register/route.ts](app/api/auth/register/route.ts)` lines 36–53: Unauthenticated `POST` creates users via `createAdminClient()` with no CAPTCHA, rate limit, or invite gate. Anyone can mass-create accounts and enumerate emails via error messages.

**Fix (short term):** Add rate limiting (e.g., Upstash Redis or in-memory). **Fix (medium term):** Add invite-only gate or move to Supabase's built-in `signUp` (which respects email confirmation settings).

### H5 — Auth bypass when env vars missing

`[proxy.ts](proxy.ts)` lines 8–12:

```ts
if (!supabaseUrl || !supabaseKey) {
  return NextResponse.next({ request }); // ← skips all auth
}
```

A misconfiguration silently disables all middleware auth. **Fix:** Throw or return a 500 error instead of silently passing through.

---

## Medium

### M1 — No rate limiting on high-value endpoints

No rate limiting exists anywhere in the project. Affected surfaces:

- `app/api/auth/register/route.ts` — mass account creation
- `app/api/analyze-athlete/route.ts` — Anthropic API cost abuse (DoS)
- `app/api/share/[token]/route.ts` — brute-force password on share links

**Fix:** Add rate limiting via Upstash Ratelimit or `@vercel/kv`. A simple per-IP or per-user limit on these 3 routes covers most of the risk.

### M2 — Share token logged in plaintext

`[app/api/share/route.ts](app/api/share/route.ts)` line 81: `console.log(... token gerado=${token})`. Tokens are high-value secrets (they grant access to athlete data). If logs are aggregated (Vercel, Datadog, etc.), tokens are exposed.

**Fix:** Remove or redact: `console.log(\`${TAG} token gerado=[REDACTED])`.

### M3 — File upload: MIME type not validated server-side

`[lib/storage.ts](lib/storage.ts)` lines 177–182: Extension and `contentType` come from client-provided `file.name` and `file.type`. A malicious client can spoof MIME and extension. `lib/photoValidation.ts` runs client-side only.

**Fix:** Re-read the first bytes of the file on the server to verify it's an image (magic bytes), or rely on Supabase Storage's transform/validate capability.

### M4 — No Content-Security-Policy header

`[next.config.ts](next.config.ts)` lines 13–25: Basic security headers are set but no `Content-Security-Policy`. Combined with H2 (XSS), this means there is no browser-level last line of defense.

**Fix:** Add a CSP header. At minimum:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### M5 — Verbose internal error messages returned to clients

`app/api/seed/route.ts`, `app/api/analyze-athlete/route.ts`, `app/api/auth/register/route.ts`: Several catch blocks return raw `err.message` or Supabase error strings to the HTTP response body. This can expose table names, query structures, or Supabase internals.

**Fix:** Log full error server-side; return a generic message to the client:

```ts
return apiError("Erro interno. Tente novamente.", 500);
```

---

## Low

### L1 — Weak password policy

`[app/api/auth/register/route.ts](app/api/auth/register/route.ts)` line 27: Minimum 6 characters, no complexity. **Fix:** Require 8+ characters and at least one number or special character.

### L2 — Dev credentials hardcoded in source

`[app/api/dev/seed-test-user/route.ts](app/api/dev/seed-test-user/route.ts)` lines 4–5: `Teste123456!` in source. Route is correctly blocked in production by `NODE_ENV` check. Low risk but bad practice.

### L3 — `getSession()` used after `getUser()` for token capture

`[app/students/[id]/assessment/_actions.ts](app/students/[id]/assessment/_actions.ts)` lines 196–199: Pattern is intentional for passing access tokens to background jobs, but `getSession()` is less authoritative than `getUser()`. Low risk since `getUser()` is the actual auth gate.

---

## Summary (Priority Order)

- C1: Wire middleware (`proxy.ts` → `middleware.ts`)
- H1: Fix open redirect in OAuth callback
- H2: Escape HTML before `dangerouslySetInnerHTML`
- H3: Tighten RLS WITH CHECK + add server-side ownership check
- H4: Rate-limit registration endpoint
- H5: Fail-closed when env vars missing
- M1: Add rate limiting to AI analysis + share endpoints
- M2: Remove share token from logs
- M3: Server-side MIME validation on uploads
- M4: Add Content-Security-Policy header
- M5: Sanitize error messages returned to clients

