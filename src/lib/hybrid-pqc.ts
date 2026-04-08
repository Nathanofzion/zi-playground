/**
 * Hybrid Post-Quantum Cryptography Layer — ML-DSA-65 (CRYSTALS-Dilithium)
 *
 * Strategy: "Hybrid proof" model
 *   - The existing secp256r1 WebAuthn passkey flow is left 100% unchanged.
 *   - After a WebAuthn assertion completes (registration or first login),
 *     we additionally sign the same challenge bytes with ML-DSA-65.
 *   - The combined proof { secpCredential, pqcSignature, pqcPublicKey } is
 *     sent together to the auth edge function.
 *   - The PQC secret key never leaves the client. It is stored in IndexedDB
 *     encrypted under a key derived from the passkey's credential ID
 *     (HKDF-SHA-256). This ties PQC storage lifetime to the passkey itself.
 *   - On subsequent logins a short-lived (TTL = 1h) in-memory session flag
 *     Skip re-signing on every API call — only on fresh auth events.
 *
 * NIST Standards used:
 *   - ML-DSA-65 = NIST FIPS 204 (final standard, Aug 2024)
 *   - Replaces / upgrades: CRYSTALS-Dilithium round 3
 *   - Security level: NIST Category III (≥ AES-192 classical, quantum-safe)
 *
 * Bundle impact: @noble/post-quantum adds ~45 KB gzipped (pure JS).
 *
 * Potential Stellar SEP/CAP: See README.quantum.md
 */

import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PQCKeyPair {
  /** 1952-byte ML-DSA-65 public key — safe to store server-side */
  publicKey: Uint8Array;
  /** 4032-byte ML-DSA-65 secret key — never leaves the client */
  secretKey: Uint8Array;
}

export interface HybridProof {
  /** Base64url encoded ML-DSA-65 signature over the challenge */
  pqcSignature: string;
  /** Base64url encoded ML-DSA-65 public key (1952 bytes) */
  pqcPublicKey: string;
  /** ISO timestamp when this proof was generated (freshness) */
  issuedAt: string;
  /** Version tag for future algorithm agility */
  alg: "ML-DSA-65";
}

export interface HybridSessionCache {
  contractId: string;
  expiresAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// IndexedDB helpers (no dependencies)
// ---------------------------------------------------------------------------

const IDB_NAME = "zi-pqc-vault";
const IDB_STORE = "keys";
const IDB_VERSION = 1;

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// Encryption helpers — AES-GCM with HKDF-derived key
// Ties the PQC secret key to the passkey credential ID so that if the
// passkey is removed, the encrypted blob becomes permanently inaccessible.
// ---------------------------------------------------------------------------

/**
 * Derive a 256-bit AES-GCM key from a passkey credential ID using HKDF-SHA-256.
 * The keyId bytes are the IKM; "zi-pqc-vault-v1" is the salt.
 */
async function deriveEncryptionKey(credentialIdBase64: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(credentialIdBase64),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("zi-pqc-vault-v1"),
      info: new TextEncoder().encode("pqc-secret-key"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSecretKey(
  secretKey: Uint8Array,
  credentialIdBase64: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveEncryptionKey(credentialIdBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    secretKey
  );
  return {
    ciphertext: toBase64url(new Uint8Array(cipherBuf)),
    iv: toBase64url(iv),
  };
}

async function decryptSecretKey(
  ciphertext: string,
  iv: string,
  credentialIdBase64: string
): Promise<Uint8Array> {
  const key = await deriveEncryptionKey(credentialIdBase64);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64url(iv) },
    key,
    fromBase64url(ciphertext)
  );
  return new Uint8Array(plainBuf);
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

function toBase64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padding));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// ---------------------------------------------------------------------------
// In-memory signed-in session cache
// Prevents re-running PQC sign on every API call after initial auth.
// TTL = 1 hour (matching JWT expiry in auth edge function).
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
let _sessionCache: HybridSessionCache | null = null;

export function getHybridSession(): HybridSessionCache | null {
  if (!_sessionCache) return null;
  if (Date.now() > _sessionCache.expiresAt) {
    _sessionCache = null;
    return null;
  }
  return _sessionCache;
}

export function setHybridSession(contractId: string): void {
  _sessionCache = {
    contractId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

export function clearHybridSession(): void {
  _sessionCache = null;
}

// ---------------------------------------------------------------------------
// Core PQC API
// ---------------------------------------------------------------------------

const PQC_KEY_PREFIX = "pqc_sk_"; // IndexedDB key prefix per contractId

/**
 * Generate a fresh ML-DSA-65 key pair and persist the encrypted secret key
 * in IndexedDB, keyed to the WebAuthn credential ID.
 *
 * Called once during wallet registration. Public key is returned so it can
 * be stored in Supabase alongside the wallet record.
 *
 * @param contractId   Passkey C-address (wallet contract ID)
 * @param keyIdBase64  WebAuthn credential ID (base64url) — used as encryption salt
 */
export async function generateAndStorePQCKeys(
  contractId: string,
  keyIdBase64: string
): Promise<{ publicKey: Uint8Array; publicKeyBase64: string }> {
  const keyPair = ml_dsa65.keygen();

  const { ciphertext, iv } = await encryptSecretKey(
    keyPair.secretKey,
    keyIdBase64
  );

  await idbSet(PQC_KEY_PREFIX + contractId, {
    ciphertext,
    iv,
    publicKeyBase64: toBase64url(keyPair.publicKey),
    contractId,
    createdAt: Date.now(),
  });

  return {
    publicKey: keyPair.publicKey,
    publicKeyBase64: toBase64url(keyPair.publicKey),
  };
}

/**
 * Retrieve and decrypt the stored ML-DSA-65 secret key for a given wallet.
 *
 * @param contractId   Passkey C-address
 * @param keyIdBase64  WebAuthn credential ID (same value used during storage)
 */
export async function loadPQCSecretKey(
  contractId: string,
  keyIdBase64: string
): Promise<Uint8Array | null> {
  const record = await idbGet<{
    ciphertext: string;
    iv: string;
    publicKeyBase64: string;
    contractId: string;
  }>(PQC_KEY_PREFIX + contractId);

  if (!record) return null;

  try {
    return await decryptSecretKey(record.ciphertext, record.iv, keyIdBase64);
  } catch (_err) {
    console.warn("[hybrid-pqc] Failed to decrypt PQC secret key — credential ID mismatch?");
    return null;
  }
}

/**
 * Load the stored ML-DSA-65 public key (base64url) for a wallet.
 * Returns null if no PQC key has been generated yet.
 */
export async function loadPQCPublicKey(contractId: string): Promise<string | null> {
  const record = await idbGet<{ publicKeyBase64: string }>(
    PQC_KEY_PREFIX + contractId
  );
  return record?.publicKeyBase64 ?? null;
}

/**
 * Sign a challenge with ML-DSA-65 and return a HybridProof.
 *
 * The challenge is the same bytes used in the WebAuthn assertion —
 * typically SHA-256(clientDataJSON || authenticatorData).
 * This creates a "dual signature" over identical challenge material.
 *
 * @param challenge    Raw challenge bytes (32–64 bytes recommended)
 * @param contractId   Passkey C-address
 * @param keyIdBase64  WebAuthn credential ID
 */
export async function signHybrid(
  challenge: Uint8Array,
  contractId: string,
  keyIdBase64: string
): Promise<HybridProof | null> {
  const secretKey = await loadPQCSecretKey(contractId, keyIdBase64);
  if (!secretKey) {
    console.warn("[hybrid-pqc] No PQC secret key found for contract:", contractId);
    return null;
  }

  const publicKeyBase64 = await loadPQCPublicKey(contractId);
  if (!publicKeyBase64) return null;

  const signature = ml_dsa65.sign(challenge, secretKey);

  return {
    pqcSignature: toBase64url(signature),
    pqcPublicKey: publicKeyBase64,
    issuedAt: new Date().toISOString(),
    alg: "ML-DSA-65",
  };
}

/**
 * Verify a HybridProof client-side (for testing / local validation).
 * Server-side verification is done in the Supabase `verify-hybrid` edge function.
 *
 * @param proof      HybridProof object from signHybrid()
 * @param challenge  The original challenge bytes
 */
export function verifyPQC(proof: HybridProof, challenge: Uint8Array): boolean {
  try {
    const sig = fromBase64url(proof.pqcSignature);
    const pk = fromBase64url(proof.pqcPublicKey);
    return ml_dsa65.verify(sig, challenge, pk);
  } catch (_err) {
    return false;
  }
}

/**
 * Remove all PQC key material for a wallet (called on disconnect/wallet removal).
 */
export async function deletePQCKeys(contractId: string): Promise<void> {
  await idbDelete(PQC_KEY_PREFIX + contractId);
  clearHybridSession();
}

/**
 * Check whether a PQC key pair exists for a given wallet.
 */
export async function hasPQCKeys(contractId: string): Promise<boolean> {
  const record = await idbGet(PQC_KEY_PREFIX + contractId);
  return record !== undefined;
}
