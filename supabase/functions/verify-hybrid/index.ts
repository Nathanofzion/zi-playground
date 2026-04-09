// deno-lint-ignore-file no-explicit-any
// verify-hybrid/index.ts
// Supabase Edge Function — validates a Hybrid PQC (ML-DSA-65) proof.
//
// POST body:
// {
//   contractId:    string   — Stellar smart-wallet contract address
//   challenge:     string   — base64url-encoded challenge bytes (same bytes
//                             that were signed on the client)
//   pqcSignature:  string   — base64url ML-DSA-65 signature
//   pqcPublicKey:  string   — base64url ML-DSA-65 public key (1952 bytes)
//   issuedAt:      string   — ISO-8601 timestamp of when the proof was created
// }
//
// Success response: { verified: true, contractId, alg: "ML-DSA-65" }
// Failure response: { verified: false, reason: string }

import { createClient } from "jsr:@supabase/supabase-js@2";
import { ml_dsa65 } from "npm:@noble/post-quantum/ml-dsa.js";

// ── Helper: base64url → Uint8Array ─────────────────────────────────────────
function fromBase64Url(b64: string): Uint8Array {
  // Normalise base64url → base64
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Replay-protection window ───────────────────────────────────────────────
const MAX_PROOF_AGE_MS = 5 * 60 * 1000; // 5 minutes

// ── CORS headers ───────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ verified: false, reason: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ verified: false, reason: "Invalid JSON body" }, 400);
  }

  const { contractId, challenge, pqcSignature, pqcPublicKey, issuedAt } = body;

  // ── Input validation ────────────────────────────────────────────────────
  if (!contractId || !challenge || !pqcSignature || !pqcPublicKey || !issuedAt) {
    return json(
      { verified: false, reason: "Missing required fields: contractId, challenge, pqcSignature, pqcPublicKey, issuedAt" },
      400
    );
  }

  // ── Replay-protection: reject proofs older than 5 minutes ───────────────
  const issuedAtDate = new Date(issuedAt);
  if (isNaN(issuedAtDate.getTime())) {
    return json({ verified: false, reason: "Invalid issuedAt timestamp" }, 400);
  }
  const ageMs = Date.now() - issuedAtDate.getTime();
  if (ageMs < 0 || ageMs > MAX_PROOF_AGE_MS) {
    return json(
      { verified: false, reason: "Proof expired or timestamp in future (max age: 5 minutes)" },
      400
    );
  }

  // ── Optional: look up stored PQC public key from Supabase ───────────────
  // When a stored key exists it takes priority over the key supplied in the
  // request body, preventing an attacker from substituting their own key.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: userRow } = await supabase
    .from("users")
    .select("pqc_public_key, pqc_algorithm")
    .eq("publicKey", contractId)
    .single();

  // If a stored key exists, use it. Otherwise fall back to the supplied key
  // (first-use scenario before the DB write from register-wallet completes).
  const authorativePublicKey: string =
    userRow?.pqc_public_key ?? pqcPublicKey;

  if (!authorativePublicKey) {
    return json(
      { verified: false, reason: "No PQC public key on record for this wallet" },
      400
    );
  }

  // ── Cryptographic verification ──────────────────────────────────────────
  try {
    const sigBytes = fromBase64Url(pqcSignature);
    const msgBytes = fromBase64Url(challenge);
    const pkBytes  = fromBase64Url(authorativePublicKey);

    // ml_dsa65.verify(signature, message, publicKey) → boolean
    const ok = ml_dsa65.verify(sigBytes, msgBytes, pkBytes);

    if (!ok) {
      return json({ verified: false, reason: "ML-DSA-65 signature verification failed" }, 200);
    }

    return json({
      verified: true,
      contractId,
      alg: "ML-DSA-65",
      keySource: userRow?.pqc_public_key ? "stored" : "provided",
    });
  } catch (err: any) {
    console.error("[verify-hybrid] Verification error:", err);
    return json(
      { verified: false, reason: "Verification threw an exception: " + (err?.message ?? String(err)) },
      500
    );
  }
});
