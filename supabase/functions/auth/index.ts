// deno-lint-ignore-file no-explicit-any
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "jsr:@simplewebauthn/server";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Keypair, TransactionBuilder } from "npm:@stellar/stellar-sdk";
import axios from "npm:axios";
import jwt from "npm:jsonwebtoken";

// Inline exceptions
class BadRequestException extends Error {
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestException";
  }
}

class NotFoundException extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundException";
  }
}

class MethodNotAllowedException extends Error {
  constructor(message = "Method Not Allowed") {
    super(message);
    this.name = "MethodNotAllowedException";
  }
}

async function handleException(fn: () => Promise<any>) {
  try {
    const result = await fn();
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status: 200
    });
  } catch (error) {
    let status = 500;
    if (error instanceof BadRequestException) status = 400;
    if (error instanceof NotFoundException) status = 404;
    if (error instanceof MethodNotAllowedException) status = 405;

    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status
    });
  }
}

// Updated environment variables (fallback to standard SUPABASE_* if APP_* not present)
const supabaseUrl =
  Deno.env.get("APP_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const supabasekey =
  Deno.env.get("APP_SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabasekey) {
  throw new Error(
    "Missing Supabase URL or anon key. Set APP_SUPABASE_URL/APP_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY)."
  );
}

const supabase = createClient(supabaseUrl, supabasekey);
// Service role client for elevated operations (user inserts, updates)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

const rpName = Deno.env.get("RP_NAME")!;
const rpID = Deno.env.get("RP_ID")!;
const origin = Deno.env.get("ORIGIN")!;

const secretKey = Deno.env.get("SECRET_KEY")!;

function arrayToUint8Array(array: number[]) {
  return new Uint8Array(array);
}

function uint8ArrayToArray(uint8Array: Uint8Array) {
  return Array.from(uint8Array);
}

function generateToken(payload: any) {
  const options = {
    expiresIn: "7d",
  };

  return jwt.sign(payload, secretKey, options);
}

// Timeout wrapper to prevent CPU time limit errors
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action, user_id, referrer, challenge_id, data } =
        await req.json();

      // Wrap all handlers with timeout protection
      switch (action) {
        case "profile":
          // Fast validation before expensive operations
          if (!data || typeof data !== "object") {
            throw new BadRequestException("Data is required");
          }
          if (!data.token || typeof data.token !== "string" || data.token.length < 10) {
            throw new BadRequestException("Valid token is required");
          }
          return await withTimeout(handleProfile(data), 5000, "Profile fetch timed out");
        case "profile-by-address":
          return await withTimeout(handleProfileByAddress(data), 5000, "Profile fetch timed out");
        case "update-profile":
          return await withTimeout(handleUpdateProfile(data), 20000, "Profile update timed out");
        case "verify-email-token":
          return await withTimeout(handleVerifyEmailToken(data), 10000, "Email verification timed out");
        case "generate-registration-options":
          return await withTimeout(handleRegistration(), 10000, "Registration options generation timed out");
        case "verify-registration":
          return await withTimeout(handleRegistrationVerification(data, user_id, referrer), 15000, "Registration verification timed out");
        case "generate-authentication-options":
          return await withTimeout(handleAuthentication(challenge_id), 10000, "Authentication options generation timed out");
        case "verify-authentication":
          return await withTimeout(handleAuthenticationVerification(data, challenge_id), 15000, "Authentication verification timed out");
        case "sign-transaction":
          return await withTimeout(handleSignTransaction(data), 20000, "Transaction signing timed out");
        case "register-wallet":
          return await withTimeout(handleRegisterWallet(data, referrer), 10000, "Wallet registration timed out");
        default:
          throw new BadRequestException();
      }
    }
    throw new MethodNotAllowedException();
  })
);

async function handleProfile(data: any) {
  if (!data || !data.token) {
    throw new BadRequestException("Token is required");
  }

  const { token } = data;

  // Fast JWT format validation before expensive jwt.verify
  if (typeof token !== "string") {
    throw new BadRequestException("Token must be a string");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new BadRequestException("Invalid JWT format");
  }

  let decoded: any;

  // jwt.verify is synchronous, so we need to catch errors immediately
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error: any) {
    // Fail fast on invalid tokens
    throw new BadRequestException(`Invalid or expired token: ${error.message}`);
  }

  if (!decoded || !decoded.id) {
    throw new BadRequestException("Invalid token payload");
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, publicKey, email, email_verified, role")
    .eq("user_id", decoded.id)
    .single();
  if (error) {
    throw new NotFoundException(`User not found: ${error.message}`);
  }
  return user;
}

async function handleProfileByAddress(data: any) {
  if (!data || !data.publicKey || typeof data.publicKey !== "string") {
    throw new BadRequestException("publicKey is required");
  }
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, publicKey, email, email_verified, role")
    .eq("publicKey", data.publicKey)
    .single();
  if (error || !user) {
    // Return empty profile rather than 404 so UI can show register state
    return { id: null, publicKey: data.publicKey, email: null, email_verified: false, role: null };
  }
  return user;
}

async function handleRegistration() {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "Smart wallet",
  });

  const { error } = await supabaseAdmin
    .from("challenges")
    .insert({ user_id: options.user.id, challenge: options.challenge });

  if (error) {
    throw new Error(error.message);
  }

  return options;
}

async function handleRegistrationVerification(
  assertionResponse: any,
  user_id: string,
  referrer: string
) {
  const { data: challenge } = await supabaseAdmin
    .from("challenges")
    .select()
    .eq("user_id", user_id)
    .single();
  if (!challenge) {
    throw new NotFoundException();
  }
  await supabaseAdmin.from("challenges").delete().eq("user_id", user_id);

  const verification = await verifyRegistrationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified) {
    const keypair = Keypair.random();
    await axios.get(
      `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
    );

    const credential = verification.registrationInfo!.credential;
    const { error } = await supabaseAdmin.from("users").insert({
      user_id: user_id,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      passkey_id: credential.id,
      passkey_public_key: uint8ArrayToArray(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (referrer) {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, referral_count")
        .eq("publicKey", referrer)
        .single();
      if (userError) {
        throw new Error(userError.message);
      }
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          referral_count: user.referral_count + 1,
        })
        .eq("publicKey", referrer);
      if (updateError) {
        throw new Error(updateError.message);
      }
      const { error: rewardError } = await supabaseAdmin.from("rewards").insert({
        user_id: user.id,
        type: "invited",
        amount: 1,
      });
      if (rewardError) {
        throw new Error(rewardError.message);
      }
    }

    const token = generateToken({
      id: user_id,
    });

    return { publicKey: keypair.publicKey(), token };
  } else {
    throw new BadRequestException("Verification failed");
  }
}

async function handleAuthentication(challenge_id: string) {
  const options = await generateAuthenticationOptions({
    rpID: rpID,
  });

  const { error } = await supabaseAdmin
    .from("challenges")
    .insert({ challenge_id, challenge: options.challenge });

  if (error) {
    throw new Error(error.message);
  }

  return options;
}

async function handleAuthenticationVerification(
  assertionResponse: any,
  challenge_id: string
) {
  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select()
    .eq("challenge_id", challenge_id)
    .single();
  if (challengeError) {
    throw new Error(challengeError.message);
  }

  if (!challenge) {
    throw new NotFoundException("Challenge not found");
  }
  await supabaseAdmin.from("challenges").delete().eq("challenge_id", challenge_id);

  const user_id = assertionResponse.response.userHandle;

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select()
    .eq("user_id", user_id)
    .single();
  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: user.passkey_id,
      publicKey: arrayToUint8Array(user.passkey_public_key),
      counter: user.counter,
      transports: user.transports,
    },
  });

  const token = generateToken({
    id: user.user_id,
  });

  if (verification.verified) {
    return {
      publicKey: user.publicKey,
      token,
    };
  } else {
    throw new BadRequestException("Verification failed");
  }
}

const handleSignTransaction = async (data: any) => {
  const { token, xdr, opts } = data;

  const decoded = jwt.verify(token, secretKey);
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select()
    .eq("user_id", decoded.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const keypair = Keypair.fromSecret(user.secretKey);

  const transaction = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);

  transaction.sign(keypair);

  return {
    signedTxXdr: transaction.toXDR(),
    signerAddress: keypair.publicKey(),
  };
};

const handleRegisterWallet = async (data: any, referrer?: string) => {
  const { contractId, pqcPublicKey } = data;

  if (!contractId) {
    throw new BadRequestException("contractId is required");
  }

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, publicKey")
    .eq("publicKey", contractId)
    .single();

  if (existingUser) {
    // If PQC public key provided, update the record (e.g., after key rotation or
    // first PQC-capable login on an existing account).
    if (pqcPublicKey) {
      await supabaseAdmin
        .from("users")
        .update({
          pqc_public_key: pqcPublicKey,
          pqc_algorithm: "ML-DSA-65",
          pqc_registered_at: new Date().toISOString(),
        })
        .eq("publicKey", contractId);
    }
    const token = generateToken({ id: contractId });
    return { publicKey: contractId, token };
  }

  const { error } = await supabaseAdmin.from("users").insert({
    user_id: contractId,
    publicKey: contractId,
    ...(pqcPublicKey
      ? {
          pqc_public_key: pqcPublicKey,
          pqc_algorithm: "ML-DSA-65",
          pqc_registered_at: new Date().toISOString(),
        }
      : {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (referrer) {
    const { data: referrerUser, error: referrerError } = await supabaseAdmin
      .from("users")
      .select("id, referral_count")
      .eq("publicKey", referrer)
      .single();

    if (!referrerError && referrerUser) {
      await supabaseAdmin
        .from("users")
        .update({ referral_count: (referrerUser.referral_count || 0) + 1 })
        .eq("publicKey", referrer);

      await supabaseAdmin.from("rewards").insert({
        user_id: referrerUser.id,
        type: "invited",
        amount: 1,
      });
    }
  }

  const token = generateToken({ id: contractId });
  return { publicKey: contractId, token };
};

const handleUpdateProfile = async (data: any) => {
  const { token, email } = data;

  if (!token || typeof token !== "string") {
    throw new BadRequestException("Authentication token is required. Please reconnect your wallet.");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err: any) {
    throw new BadRequestException(`Session expired — please reconnect your wallet: ${err.message}`);
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new BadRequestException("A valid email address is required.");
  }

  // Generate a verification token (expires in 24h)
  const verificationToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      email,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires_at: expiresAt,
    })
    .eq("user_id", decoded.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const siteUrl = Deno.env.get("SITE_URL") || "https://zi-playground.vercel.app";
  const verificationUrl = `${siteUrl}/api/verify-email?token=${verificationToken}`;

  // Send verification email via ICUK SMTP (non-fatal — verificationUrl always returned as fallback)
  const emailSent = await sendVerificationEmail(email, verificationUrl);

  return {
    message: "Profile updated successfully",
    verificationUrl,
    emailSent,
  };
};

const handleVerifyEmailToken = async (data: any) => {
  const { token } = data;

  if (!token || typeof token !== "string") {
    throw new BadRequestException("Verification token is required");
  }

  const now = new Date().toISOString();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email_verified, email_verification_expires_at")
    .eq("email_verification_token", token)
    .single();

  if (error || !user) {
    throw new BadRequestException("Invalid or expired verification token");
  }

  if (user.email_verified) {
    return { message: "Email already verified" };
  }

  if (user.email_verification_expires_at && user.email_verification_expires_at < now) {
    throw new BadRequestException("Verification token has expired. Please request a new one.");
  }

  await supabaseAdmin
    .from("users")
    .update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
    })
    .eq("id", user.id);

  return { message: "Email verified successfully" };
};

/**
 * Send a verification email via ICUK SMTP.
 * Uses denomailer (Deno-native SMTP client — no Node.js APIs, works in Supabase edge functions).
 * Supabase edge functions run on their own infrastructure and are NOT subject to the
 * outbound TCP port blocks that Vercel/AWS impose.
 *
 * Required secrets (set via `supabase secrets set`):
 *   SMTP_HOST  — smtp.interdns.co.uk
 *   SMTP_USER  — noreply@zig3.uk
 *   SMTP_PASS  — (already set)
 *   SMTP_PORT  — 587 (default) or 465 for implicit TLS
 */
async function sendVerificationEmail(to: string, verificationUrl: string): Promise<boolean> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  // Port 465 = implicit TLS (connectTLS) — more reliable in Deno than 587 STARTTLS
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("[email] SMTP_HOST/SMTP_USER/SMTP_PASS not configured — skipping email send");
    return false;
  }

  try {
    // denomailer is a Deno-native SMTP client (uses Deno.connect, not Node.js net/tls)
    const { SmtpClient } = await import("https://deno.land/x/denomailer@0.12.0/mod.ts");
    const client = new SmtpClient();

    const connectConfig = { hostname: smtpHost, port: smtpPort, username: smtpUser, password: smtpPass };
    if (smtpPort === 465) {
      await client.connectTLS(connectConfig);  // implicit TLS — preferred
    } else {
      await client.connect(connectConfig);     // STARTTLS on port 587 / 25
    }

    await client.send({
      from: smtpUser,
      to,
      subject: "Verify your email — Zi Playground",
      content: `Verify your Zi Playground email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0a0a0a;padding:40px"><div style="max-width:480px;margin:0 auto;background:#111;border-radius:12px;padding:32px;border:1px solid #333"><h1 style="color:#a78bfa;margin-top:0">Verify your email</h1><p style="color:#ccc">Click the button below to verify your email and unlock your Zi token rewards.</p><a href="${verificationUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a><p style="color:#666;font-size:12px">This link expires in 24 hours. If you did not register, ignore this email.</p><p style="color:#555;font-size:11px">Or copy: <span style="color:#888;word-break:break-all">${verificationUrl}</span></p></div></body></html>`,
    });

    await client.close();
    console.log("[email] Verification email sent to", to);
    return true;
  } catch (e) {
    console.error("[email] SMTP send failed:", e instanceof Error ? e.message : String(e));
    return false;
  }
}