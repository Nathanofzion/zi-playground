# Hybrid Post-Quantum Cryptography — ZI Playground

## Overview

This document describes the **Hybrid ML-DSA-65 / secp256r1** authentication layer added to ZI Playground on the `Quantum-ML-DSA` branch.  The goal is to make passkey wallets quantum-safe **today**, before large-scale quantum computers become a practical threat to elliptic-curve cryptography.

---

## Why Hybrid PQC?

| Threat | Status |
|--------|--------|
| Harvest-now / decrypt-later attacks | Active today — adversaries archive ciphertext for future decryption |
| NIST PQC Timeline | FIPS 203/204/205 finalized August 2024 |
| secp256r1 (WebAuthn) | Vulnerable to Shor's algorithm on a cryptographically-relevant quantum computer |
| ML-DSA-65 (CRYSTALS-Dilithium) | NIST FIPS 204 Category III — no known quantum speedup |

Running both signature schemes in parallel (hybrid) means an attacker must break **both** to forge an authentication proof.

---

## Algorithm Selection — ML-DSA-65

ML-DSA-65 is the NIST FIPS 204 standardized form of **CRYSTALS-Dilithium Level 3**.

| Parameter | Value |
|-----------|-------|
| Standard | NIST FIPS 204 (finalized Aug 2024) |
| Security level | Category III (≈ AES-192) |
| Public key size | 1 952 bytes |
| Secret key size | 4 032 bytes |
| Signature size | 3 309 bytes |
| Sign latency | ~14 ms (browser, M2) |
| Verify latency | ~3 ms (browser, M2) |
| Implementation | `@noble/post-quantum` v0.6.0 (audited, zero dependencies) |

---

## Architecture

```
WebAuthn (secp256r1)           ML-DSA-65
        │                           │
  browser authenticator       IndexedDB vault
        │                           │ (AES-GCM encrypted, keyed to
        │                           │  credential ID via HKDF-SHA-256)
        ▼                           ▼
  WebAuthn assertion         ml_dsa65.sign(challenge, sk)
        │                           │
        └──────── HybridProof ──────┘
                      │
              Supabase register-wallet
              (pqcPublicKey stored in users table)
                      │
            /functions/verify-hybrid
              ml_dsa65.verify(sig, challenge, pk)
                      │
                 { verified: true }
```

The WebAuthn flow is **not modified in any way**.  ML-DSA-65 runs as an independent parallel layer.

---

## File Map

| File | Role |
|------|------|
| `src/lib/hybrid-pqc.ts` | Core PQC library — keygen, sign, verify, IndexedDB vault |
| `src/lib/passkeyClient.ts` | Hooks: keygen on registration, cleanup on disconnect |
| `supabase/functions/auth/index.ts` | Stores `pqc_public_key` in `users` table on wallet registration |
| `supabase/functions/verify-hybrid/index.ts` | Edge function — verifies ML-DSA-65 proof server-side |

---

## Key Storage & Protection

PQC secret keys are stored in the browser's **IndexedDB** (`zi-pqc-vault`), encrypted with **AES-GCM 256-bit**.  The encryption key is derived via **HKDF-SHA-256** from the WebAuthn credential ID (which never leaves the authenticator):

```
IKM  = UTF-8(credentialIdBase64)
Salt = UTF-8("zi-pqc-vault-v1")
Info = UTF-8("pqc-secret-key")
Key  = HKDF-SHA-256(IKM, Salt, Info) → 32 bytes → AES-GCM key
```

This means:
- The encrypted blob is useless without the credential ID.
- The credential ID is only retrievable via a successful WebAuthn assertion.
- Clearing browser storage or revoking the passkey revokes the PQC secret key as well.

---

## `HybridProof` Schema

```typescript
interface HybridProof {
  pqcSignature:  string;   // base64url ML-DSA-65 signature (3309 bytes)
  pqcPublicKey:  string;   // base64url ML-DSA-65 public key (1952 bytes)
  issuedAt:      string;   // ISO-8601 UTC timestamp
  alg:           "ML-DSA-65";
}
```

The **challenge bytes** signed are identically the same challenge used by the WebAuthn assertion, so both proofs cover the same nonce.

---

## Replay Protection

The `verify-hybrid` edge function rejects proofs with an `issuedAt` timestamp older than **5 minutes** or in the future.  For production, consider adding the proof to a short-lived nonce table in Supabase to prevent within-window replay.

---

## Session Cache

To avoid re-signing on every API call, a **1-hour in-memory session cache** tracks the active wallet.  The cache is keyed by `contractId` and invalidated on `disconnect()`.

---

## Supabase Schema Addition

The following columns are needed on the `users` table:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pqc_public_key    text,
  ADD COLUMN IF NOT EXISTS pqc_algorithm     text,
  ADD COLUMN IF NOT EXISTS pqc_registered_at timestamptz;
```

> Create `supabase/migrations/<timestamp>_add_pqc_columns.sql` with the above SQL and apply with `supabase db push`.

---

## SEP Proposal (Draft) — Hybrid PQC Authentication for Stellar Smart Wallets

**Title**: SEP-XX: Hybrid Post-Quantum Authentication for Passkey Smart Wallets  
**Author**: ZI Playground contributors  
**Status**: Draft

### Abstract

Defines a standard for attaching an ML-DSA-65 (FIPS 204) proof alongside existing WebAuthn / secp256r1 payloads when authenticating Stellar smart-wallet sessions.  Servers MAY verify the ML-DSA-65 proof independently for enhanced security.

### Motivation

WebAuthn passkeys rely on secp256r1 signatures.  While secp256r1 is secure today, its long-term security against adversaries with quantum computing capability is not guaranteed.  Defining a hybrid scheme now allows wallets and relying parties to begin building PQC infrastructure ahead of need.

### Specification (sketch)

1. **Registration**: Wallets generate an ML-DSA-65 key pair.  The public key is included in the SEP-10 `register` call as `pqc_public_key` (base64url).
2. **Authentication**: Every WebAuthn assertion is accompanied by a `hybrid_proof` JSON object containing `{ pqcSignature, pqcPublicKey, issuedAt, alg }`.
3. **Verification**: Relying parties verify the WebAuthn assertion as normal, then optionally verify the ML-DSA-65 proof using the stored public key.
4. **Backward compatibility**: Relying parties MUST NOT reject assertions that lack a `hybrid_proof` (facilitates gradual rollout).

### Security Considerations

- Secret key protection relies on IndexedDB + AES-GCM; hardware security module support is desirable for high-security wallets.
- Keys should be re-generated if the WebAuthn credential is re-enrolled.
- Signature size (~3.3 KB) adds modest overhead to authentication payloads.

---

## CAP Proposal (Draft) — Hybrid Signature Verification in Stellar Core

**Title**: CAP-XX: Native ML-DSA-65 + secp256r1 Hybrid Signer Support  
**Author**: ZI Playground contributors  
**Status**: Concept

### Abstract

Proposes adding a new Stellar account signer type `HYBRID_PASSKEY_PQC` that encodes both a secp256r1 public key and an ML-DSA-65 public key.  Transaction authorization requires valid signatures from **both** schemes.

### Motivation

Stellar currently supports ed25519, secp256r1 (via SEP-43 / smart wallet contract signers), and pre-auth/hash signers.  Adding a hybrid signer type would allow on-chain enforcement of post-quantum security guarantees without requiring off-chain verification infrastructure.

### High-Level Design

- New `SignerKeyType` variant: `SIGNER_KEY_TYPE_HYBRID_PQC` (value TBD)
- Payload: `secp256r1_pubkey (65 bytes) || ml_dsa65_pubkey (1952 bytes)`
- Stellar validators verify both signatures; transaction fails if either is missing or invalid
- Smart wallet contracts expose a new authorization entry variant for hybrid signers

### Timeline / Dependencies

- Depends on Stellar Protocol 23+ XDR
- Requires validator client updates (stellar-core, horizon)
- Estimated implementation: 6–12 months after CAP acceptance

---

## Testing

```bash
# Run unit tests
pnpm test

# TypeScript type-check
pnpm tsc --noEmit

# Build
pnpm build

# Deploy verify-hybrid edge function
supabase functions deploy verify-hybrid
```

### PQC Smoke Test (browser console)

```javascript
// Import from the hybrid-pqc module (dev only)
import { generateAndStorePQCKeys, signHybrid, verifyPQC } from '@/lib/hybrid-pqc';

const { publicKey } = await generateAndStorePQCKeys('C_TEST_CONTRACT', 'test_key_id');
const proof = await signHybrid(new Uint8Array(32), 'C_TEST_CONTRACT', 'test_key_id');
console.log('PQC sign result:', proof);
console.log('PQC verify:', verifyPQC(proof, new Uint8Array(32)));
// Expected: { verified: true }
```

---

## Performance Budget

| Operation | Time (M2 MacBook) | Time (budget mobile) |
|-----------|-------------------|----------------------|
| Key generation | ~25 ms | ~80 ms |
| Sign | ~14 ms | ~45 ms |
| Verify (client) | ~3 ms | ~10 ms |
| Verify (Deno edge) | ~5 ms | — |
| Bundle size delta | +~180 KB (gzip ~55 KB) | — |

The PQC layer adds at most ~80 ms to wallet creation on low-end mobile devices, which is within the acceptable budget for a one-time operation.

---

## Bundle Impact

`@noble/post-quantum` ships as a pure ESM package with no dependencies.  Only the `ml-dsa.js` sub-module is imported, limiting the bundle delta.

To analyze:

```bash
pnpm build && du -sh .next/static/chunks/*.js | sort -h | tail -20
```

---

*Branch: `Quantum-ML-DSA` · Implementation: `src/lib/hybrid-pqc.ts` · Standard: NIST FIPS 204*
