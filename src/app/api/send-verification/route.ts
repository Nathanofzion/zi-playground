import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM_EMAIL = "Zi Playground <noreply@zi-playground.com>";
const SUBJECT = "Verify your email — Zi Playground";

function buildEmailHtml(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px;">
    <div style="max-width: 480px; margin: 0 auto; background: #111; border-radius: 12px; padding: 32px; border: 1px solid #333;">
      <h1 style="color: #a78bfa; margin-top: 0;">Verify your email</h1>
      <p style="color: #ccc;">Click the button below to verify your email and unlock your Zi token rewards.</p>
      <a href="${verificationUrl}"
         style="display: inline-block; margin: 24px 0; padding: 14px 28px;
                background: #7c3aed; color: #fff; border-radius: 8px;
                text-decoration: none; font-weight: 600;">
        Verify Email
      </a>
      <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you did not register, you can ignore this email.</p>
      <p style="color: #555; font-size: 11px; margin-bottom: 0;">
        Or copy this URL into your browser:<br/>
        <span style="color: #888; word-break: break-all;">${verificationUrl}</span>
      </p>
    </div>
  </body>
</html>`;
}

/**
 * POST /api/send-verification
 * Body: { email: string, verificationUrl: string }
 *
 * Sends a verification email via Resend.
 * If RESEND_API_KEY is not set, returns the verificationUrl in the response
 * so it can be used for manual testing.
 */
export async function POST(req: NextRequest) {
  let email: string;
  let verificationUrl: string;

  try {
    const body = await req.json();
    email = body.email;
    verificationUrl = body.verificationUrl;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !verificationUrl) {
    return NextResponse.json({ error: "email and verificationUrl are required" }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Basic URL check — must be same origin to prevent open redirect abuse
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zi-playground.vercel.app";
  if (!verificationUrl.startsWith(appUrl) && !verificationUrl.startsWith("http://localhost")) {
    return NextResponse.json({ error: "Invalid verification URL" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // No email service configured — return the URL so the dev can test manually
    console.log(`[send-verification] No RESEND_API_KEY. Verification URL for ${email}:`, verificationUrl);
    return NextResponse.json({
      sent: false,
      message: "RESEND_API_KEY not configured — use verificationUrl to verify manually",
      verificationUrl,
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: SUBJECT,
        html: buildEmailHtml(verificationUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[send-verification] Resend error:", err);
      return NextResponse.json(
        { error: "Failed to send email", details: err },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-verification] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
