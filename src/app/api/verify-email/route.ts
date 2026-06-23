import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/verify-email?token=<uuid>
 *
 * Called when a user clicks the email verification link.
 * Marks their email as verified in Supabase and redirects to home.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?verified=error&reason=missing_token", req.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    // Fallback: call Supabase edge function if service key not available
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ action: "verify-email-token", data: { token } }),
      });
      const result = await res.json();
      if (!res.ok || result?.error) {
        return NextResponse.redirect(new URL("/?verified=error&reason=invalid_token", req.url));
      }
      return NextResponse.redirect(new URL("/?verified=success", req.url));
    } catch {
      return NextResponse.redirect(new URL("/?verified=error&reason=server_error", req.url));
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const now = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email_verified, email_verification_expires_at")
    .eq("email_verification_token", token)
    .single();

  if (error || !user) {
    return NextResponse.redirect(new URL("/?verified=error&reason=invalid_token", req.url));
  }

  if (user.email_verified) {
    return NextResponse.redirect(new URL("/?verified=already", req.url));
  }

  if (user.email_verification_expires_at && user.email_verification_expires_at < now) {
    return NextResponse.redirect(new URL("/?verified=error&reason=expired", req.url));
  }

  await supabase
    .from("users")
    .update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
    })
    .eq("id", user.id);

  return NextResponse.redirect(new URL("/?verified=success", req.url));
}
