import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.interdns.co.uk";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "";

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
 * Internal endpoint — called by the Supabase edge function.
 * Requires X-Internal-Secret header matching INTERNAL_API_SECRET env var.
 * Uses nodemailer + ICUK SMTP (port 465 implicit TLS) to send verification emails.
 */
export async function POST(req: NextRequest) {
  // Authenticate internal calls only
  const secret = req.headers.get("x-internal-secret");
  if (INTERNAL_API_SECRET && secret !== INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zi-playground.vercel.app";
  if (!verificationUrl.startsWith(appUrl) && !verificationUrl.startsWith("http://localhost")) {
    return NextResponse.json({ error: "Invalid verification URL" }, { status: 400 });
  }

  if (!SMTP_USER || !SMTP_PASS) {
    console.log(`[send-verification] SMTP not configured. URL for ${email}:`, verificationUrl);
    return NextResponse.json({ sent: false, message: "SMTP not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true = implicit TLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Zi Playground" <${SMTP_USER}>`,
      to: email,
      subject: "Verify your email — Zi Playground",
      text: `Verify your Zi Playground email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
      html: buildEmailHtml(verificationUrl),
    });

    console.log(`[send-verification] Email sent to ${email}`);
    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-verification] SMTP error:", message);
    return NextResponse.json({ sent: false, error: message }, { status: 502 });
  }
}

// To enable real email delivery:
//   1. Sign up at https://resend.com (free — 100 emails/day, no credit card)
//   2. Add RESEND_API_KEY=re_xxxx to Vercel env vars → Redeploy
//   3. Optionally set SMTP_FROM=noreply@zig3.uk after verifying zig3.uk in Resend DNS settings
//      (without domain verification, Resend only allows "onboarding@resend.dev" as the sender)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.SMTP_FROM || "onboarding@resend.dev";
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
 * Sends a verification email via Resend's HTTP API (works on Vercel/AWS — no SMTP ports needed).
 * Returns { sent: true } on success, or { sent: false, verificationUrl } if RESEND_API_KEY not set.
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Security: ensure the link points to our own domain (prevent open redirect abuse)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zi-playground.vercel.app";
  if (!verificationUrl.startsWith(appUrl) && !verificationUrl.startsWith("http://localhost")) {
    return NextResponse.json({ error: "Invalid verification URL" }, { status: 400 });
  }

  if (!RESEND_API_KEY) {
    // No email service configured — caller falls back to showing the inline link in the UI
    console.log(`[send-verification] No RESEND_API_KEY. Verification URL for ${email}:`, verificationUrl);
    return NextResponse.json({
      sent: false,
      message: "Add RESEND_API_KEY to Vercel env vars to enable email delivery",
      verificationUrl,
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: SUBJECT,
        html: buildEmailHtml(verificationUrl),
      }),
    });

    if (res.ok) {
      return NextResponse.json({ sent: true });
    }

    const errBody = await res.json().catch(() => ({}));
    console.error("[send-verification] Resend error:", errBody);
    return NextResponse.json(
      { sent: false, error: "Failed to send email", verificationUrl },
      { status: 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-verification] error:", message);
    return NextResponse.json(
      { sent: false, error: message, verificationUrl },
      { status: 502 }
    );
  }
}
