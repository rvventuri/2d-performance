import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

const TAG = "[POST /api/share]";

// ─── POST /api/share — cria ou substitui link de compartilhamento ────────────

export async function POST(request: NextRequest) {
  // 1. Autenticação
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error(`${TAG} createClient falhou:`, err);
    return NextResponse.json({ error: "Erro interno ao criar cliente Supabase" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(`${TAG} usuário não autenticado`);
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  console.log(`${TAG} user=${user.id}`);

  // 2. Payload
  let studentId: string;
  let password: string | undefined;
  try {
    const body = await request.json() as { studentId?: string; password?: string };
    studentId = body.studentId ?? "";
    password = body.password;
  } catch (err) {
    console.error(`${TAG} body inválido:`, err);
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!studentId) {
    console.warn(`${TAG} studentId ausente`);
    return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });
  }
  console.log(`${TAG} studentId=${studentId} hasPassword=${!!password}`);

  // 3. Verifica posse do atleta (via client autenticado — respeita RLS)
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("user_id", user.id)
    .single();

  if (studentError || !student) {
    console.warn(`${TAG} atleta não encontrado:`, studentError?.message);
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  // 4. Admin client (service role)
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error(`${TAG} createAdminClient falhou — verifique SUPABASE_SERVICE_ROLE_KEY:`, err);
    return NextResponse.json(
      { error: "Configuração do servidor incompleta", detail: (err as Error).message },
      { status: 500 }
    );
  }

  // 5. Remove link anterior
  const { error: deleteError } = await admin
    .from("share_links")
    .delete()
    .eq("student_id", studentId)
    .eq("user_id", user.id);

  if (deleteError) {
    // Não é fatal — pode ser que a tabela não exista ainda
    console.warn(`${TAG} delete anterior falhou (ignorado):`, deleteError.message, deleteError.code);
  }

  // 6. Hash de senha
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  // 7. Insere novo link (token gerado no servidor — evita dependência do encode do PG)
  const token = generateToken();
  console.log(`${TAG} token gerado=${token}`);

  const { data: link, error: insertError } = await admin
    .from("share_links")
    .insert({
      student_id: studentId,
      user_id: user.id,
      token,
      password_hash: passwordHash,
    })
    .select("token, created_at")
    .single();

  if (insertError || !link) {
    console.error(`${TAG} insert falhou — code=${insertError?.code} hint=${insertError?.hint}:`, insertError?.message);
    return NextResponse.json(
      {
        error: "Erro ao criar link",
        detail: insertError?.message,
        hint: insertError?.hint,
        code: insertError?.code,
      },
      { status: 500 }
    );
  }

  console.log(`${TAG} link criado token=${link.token}`);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    token: link.token,
    url: `${baseUrl}/share/${link.token}`,
    hasPassword: !!passwordHash,
    createdAt: link.created_at,
  });
}

// ─── GET /api/share?studentId= — metadados do link atual ────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });
  }

  const { data: link, error } = await supabase
    .from("share_links")
    .select("token, password_hash, created_at")
    .eq("student_id", studentId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = "no rows" — é esperado quando não há link
    console.warn(`[GET /api/share] erro ao buscar link:`, error.message, error.code);
  }

  if (!link) return NextResponse.json(null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    token: link.token,
    url: `${baseUrl}/share/${link.token}`,
    hasPassword: !!link.password_hash,
    createdAt: link.created_at,
  });
}

// ─── DELETE /api/share?studentId= — revoga o link ───────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });
  }

  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("student_id", studentId)
    .eq("user_id", user.id);

  if (error) {
    console.error(`[DELETE /api/share] erro:`, error.message, error.code);
  }

  return new NextResponse(null, { status: 204 });
}
