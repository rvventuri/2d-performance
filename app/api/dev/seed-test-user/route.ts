import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_EMAIL = "teste@2d-performance.local";
const DEFAULT_PASSWORD = "Teste123456!";

/**
 * POST /api/dev/seed-test-user
 * Cria um usuário de teste no Auth (e-mail já confirmado).
 * Só funciona com NODE_ENV=development e SUPABASE_SERVICE_ROLE_KEY definida.
 *
 * Body opcional: { "email"?: string, "password"?: string }
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "Rota desativada fora do ambiente de desenvolvimento (NODE_ENV !== development).",
      },
      { status: 403 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "Configure SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase → Project Settings → API → service_role).",
      },
      { status: 503 }
    );
  }

  let email = DEFAULT_EMAIL;
  let password = DEFAULT_PASSWORD;
  try {
    const body = await req.json();
    if (body?.email && typeof body.email === "string") {
      email = body.email.trim();
    }
    if (body?.password && typeof body.password === "string") {
      password = body.password;
    }
  } catch {
    // body vazio ou inválido — usa defaults
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "email e password não podem ser vazios" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        return NextResponse.json(
          {
            ok: false,
            message: "Este e-mail já está cadastrado.",
            email,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Usuário de teste criado. Faça login na página /login.",
      email,
      userId: data.user?.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar usuário";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
