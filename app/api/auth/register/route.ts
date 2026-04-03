import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiOk, apiError } from "@/lib/api";

interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  specialty: string;
}

export async function POST(request: NextRequest) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return apiError("Body inválido.", 400);
  }

  const { email, password, full_name, phone, specialty } = body;

  if (!email || !password || !full_name || !phone || !specialty) {
    return apiError("Todos os campos são obrigatórios.", 400);
  }

  if (password.length < 6) {
    return apiError("A senha deve ter pelo menos 6 caracteres.", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return apiError("Formato de e-mail inválido.", 400);
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, specialty },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return apiError("Este e-mail já está cadastrado.", 409);
      }
      return apiError(error.message, 400);
    }

    return apiOk({ userId: data.user.id }, 201);
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return apiError("Erro interno no servidor.", 500);
  }
}
