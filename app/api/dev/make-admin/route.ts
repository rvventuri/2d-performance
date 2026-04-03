import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiOk, apiError } from "@/lib/api";

/**
 * One-time endpoint to grant admin access to a user.
 * Protected by requiring the SUPABASE_SERVICE_ROLE_KEY in the x-admin-secret header.
 *
 * Usage:
 *   curl -X POST /api/dev/make-admin \
 *     -H "Content-Type: application/json" \
 *     -H "x-admin-secret: <SUPABASE_SERVICE_ROLE_KEY>" \
 *     -d '{"userId": "<user-id>"}'
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || secret !== serviceKey) {
    return apiError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const userId = (body as { userId?: string })?.userId;
  if (!userId || typeof userId !== "string") {
    return apiError("userId is required", 400);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { is_admin: true },
  });

  if (error) return apiError(error.message, 500);

  return apiOk({
    userId: data.user.id,
    email: data.user.email,
    isAdmin: data.user.app_metadata?.is_admin ?? false,
  });
}
