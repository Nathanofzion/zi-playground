import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 *
 * Returns all registered users with their emails.
 * Protected by ADMIN_SECRET env var — must pass as Bearer token.
 *
 * Usage:
 *   curl https://zi-playground.vercel.app/api/admin/users \
 *     -H "Authorization: Bearer <ADMIN_SECRET>"
 *
 * Optional query params:
 *   ?email_only=true   — only return rows that have an email set
 *   ?limit=100         — max rows (default 500)
 */
export async function GET(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "Admin endpoint not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { searchParams } = new URL(req.url);
  const emailOnly = searchParams.get("email_only") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "500", 10), 2000);

  let query = supabase
    .from("users")
    .select("id, publicKey, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (emailOnly) {
    query = query.not("email", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/users] Supabase error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data?.length ?? 0,
    users: data,
  });
}
