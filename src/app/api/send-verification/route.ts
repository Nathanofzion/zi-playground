import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM_EMAIL = process.env.SMTP_FROM || "noreply@zi-playground.com";
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

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // true = SSL (465), false = STARTTLS (25/587)
    requireTLS: port !== 465, // force STARTTLS upgrade on port 25 / 587
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // ICUK uses self-signed certs on some servers
  });
}

/**
 * POST /api/send-verification
 * Body: { email: string, verificationUrl: string }
 *
 * Sends a verification email via ICUK SMTP (nodemailer).
 * If SMTP env vars are not set, returns the verificationUrl in the response
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Ensure the link points to our own domain to prevent open redirect abuse
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zi-playground.vercel.app";
  if (!verificationUrl.startsWith(appUrl) && !verificationUrl.startsWith("http://localhost")) {
    return NextResponse.json({ error: "Invalid verification URL" }, { status: 400 });
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[send-verification] SMTP not configured. Verification URL for ${email}:`, verificationUrl);
    return NextResponse.json({
      sent: false,
      message: "SMTP not configured — use verificationUrl to verify manually",
      verificationUrl,
    });
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: SUBJECT,
      html: buildEmailHtml(verificationUrl),
    });

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error("[send-verification] SMTP error:", err?.message);
    return NextResponse.json({ error: "Failed to send email", details: err?.message }, { status: 502 });
  }
}
