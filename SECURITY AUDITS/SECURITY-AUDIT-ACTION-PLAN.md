# Zi Playground — Security Audit Action Plan

**Frameworks applied:** ISO/IEC 27001:2022 · Certra 4 A's · Stellar STRIDE  
**Audit date initiated:** 24 April 2026  
**Auditors:** (assign before starting)  
**Status:** ⬜ Not started

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [A1 — Assets](#2-a1--assets)
3. [A2 — Actors](#3-a2--actors)
4. [A3 — Assumptions](#4-a3--assumptions)
5. [A4 — Attack Vectors](#5-a4--attack-vectors)
6. [STRIDE Threat Table](#6-stride-threat-table)
7. [ISO 27001 Control Checklist](#7-iso-27001-control-checklist)
8. [Smart Contract Audit Checklist](#8-smart-contract-audit-checklist)
9. [Pre-identified Issues from Code Review](#9-pre-identified-issues-from-code-review)
10. [Audit Sign-off](#10-audit-sign-off)

---

## 1. System Overview

Zi Playground is a Stellar testnet application providing:
- **Passkey wallet** (WebAuthn + secp256r1) with hybrid **ML-DSA-65 (NIST FIPS 204)** post-quantum layer
- **Airdrop** and **token reward** distribution via a Soroban smart contract
- **Soroswap DEX** integration (liquidity, swap)
- **Tetris mini-game** with on-chain reward distribution
- **Backend**: Next.js 14 App Router (Vercel), Supabase (Postgres + Edge Functions)
- **Chain**: Stellar Testnet → mainnet planned

### Data Flow Summary

```
Browser (Next.js)
  │── WebAuthn assertion (secp256r1)
  │── ML-DSA-65 hybrid proof (IndexedDB-stored key)
  └──► Supabase Edge Functions (auth / score / rewards / verify-hybrid)
         │── Supabase Postgres (RLS enforced)
         └──► Stellar RPC → Soroban Smart Contract
                  └──► Distribute ZITOKEN to player wallet
```

---

## 2. A1 — Assets

### Critical Data (PII & Finance)

| Asset | Location | Classification | ISO 27001 Annex A |
|-------|----------|---------------|-------------------|
| User passkey public key (secp256r1) | Supabase `users.passkey_public_key` | Confidential | A.8.2 |
| User wallet contract address | Supabase `users.user_id` | Internal | A.8.2 |
| ML-DSA-65 public key | Supabase `users.pqc_public_key` | Internal | A.8.2 |
| ML-DSA-65 **secret key** (encrypted) | Browser IndexedDB (`zi-pqc-vault`) | **Secret** | A.8.24 |
| Funder Stellar secret key (`FUNDER_SECRET_KEY`) | Vercel env + Supabase secret | **Secret** | A.8.24 |
| Supabase service role key | Vercel env (server-side only) | **Secret** | A.8.24 |
| JWT signing secret (`SECRET_KEY`) | Supabase secret | **Secret** | A.8.24 |
| Mercury JWT | Supabase secret | Confidential | A.8.24 |
| Reward balances / transaction history | Supabase `rewards` + Stellar ledger | Confidential | A.8.2 |
| Game scores (leaderboard) | Supabase `scores` | Internal | A.8.2 |
| WebAuthn challenge state | Supabase `challenges` | Internal | A.8.2 |

### Core Services

| Service | Purpose | Exposure |
|---------|---------|----------|
| `supabase/functions/auth` | Passkey register/login, JWT issue | Public (authenticated) |
| `supabase/functions/verify-hybrid` | ML-DSA-65 proof validation | Public (authenticated) |
| `supabase/functions/rewards` | Claim ZITOKEN rewards | Public (authenticated) |
| `supabase/functions/score` | Write leaderboard entry | Public (authenticated) |
| `supabase/functions/soroswap` | DEX routing / swap | Public (authenticated) |
| `src/app/api/airdrop/route.ts` | Distribute tokens via funder key | **Public (no auth check)** ⚠️ |
| `src/app/api/fund/[address]/route.ts` | Fund any address | **Public (no auth check)** ⚠️ |
| Soroban smart contract (Game Reward) | Token distribution, game config | On-chain |

### System Infrastructure

| Component | Provider | Notes |
|-----------|----------|-------|
| Next.js hosting | Vercel (iad1) | Serverless |
| Database | Supabase Postgres (Pg 17.6) | RLS enforced |
| Edge Functions | Supabase Deno runtime | |
| Blockchain | Stellar Testnet → Mainnet | |
| Indexing | Mercury Data API | |
| Key relay | OpenZeppelin Testnet Relayer | |
| PQC secret storage | Browser IndexedDB | AES-GCM encrypted |

---

## 3. A2 — Actors

### Authorized Users

| Actor | Access Method | Trust Level |
|-------|--------------|-------------|
| End user (browser wallet) | WebAuthn passkey + hybrid PQC proof | Low — verify every request |
| Authenticated leaderboard reader | Supabase anon key | Very Low |

### Administrators

| Actor | Access | Scope |
|-------|--------|-------|
| Smart contract admin | Funder keypair (`GAYW7P7VQ6BDSSW4...`) | Can call `add_game_type`, `distribute_reward` |
| Supabase service role | `service_role` JWT | Full DB bypass of RLS |
| Vercel deployer | Vercel dashboard + CLI | Deploy, env vars |
| Supabase project owner | Dashboard | DB, migrations, secrets |

### External Services

| Service | Data Shared | Trust Level |
|---------|------------|------------|
| OpenZeppelin Relayer | Stellar transactions | High (infrastructure) |
| Mercury Data API | Wallet/signer index | Medium |
| Stellar RPC (`soroban-testnet.stellar.org`) | Transaction submission | High |
| Soroswap DEX contracts | Swap amounts, token addresses | Medium |
| `@noble/post-quantum` library | PQC crypto ops | High — pinned version |
| `@simplewebauthn/server` | Passkey verification | High — pinned version |

### Internal Services

| Service | Notes |
|---------|-------|
| `contract.ts` (shared fn module) | Used by score/rewards edge functions |
| `hybrid-pqc.ts` (client lib) | PQC keygen, sign, verify |
| `localKeyStorage.ts` | Must audit — non-IndexedDB key path |

---

## 4. A3 — Assumptions

### Secure Network

- [ ] **WAF**: Verify Vercel's WAF is enabled for the project (Settings → Security)
- [ ] **CORS**: `verify-hybrid` uses `Access-Control-Allow-Origin: *` — needs restriction to own domain
- [ ] **HTTPS**: Enforced by Vercel. Confirm HSTS header is present in production response
- [ ] **CSP**: No `Content-Security-Policy` header exists in `vercel.json` — **needs adding**
- [ ] Supabase project is not publicly accessible via direct Postgres port

### Trusted Third-Parties

- [ ] Audit all npm/pnpm dependencies with `pnpm audit`
- [ ] Pin `@noble/post-quantum` to exact version (no `^` prefix) — verify in `package.json`
- [ ] Pin `@simplewebauthn/server` and `@simplewebauthn/browser` to exact versions
- [ ] Check Mercury Data API data integrity — can results be manipulated to fake wallet records?
- [ ] OpenZeppelin relayer: confirm transactions cannot be replayed or front-run

### Unaltered Code

- [ ] Enable GitHub branch protection on `main` — require PR + review before merge
- [ ] Enable Vercel deployment protection — require GitHub team approval for production deploys
- [ ] Add `pnpm audit --audit-level=high` to CI pipeline (GitHub Actions)
- [ ] Smart contract: verify deployed WASM hash matches local build (`NEXT_PUBLIC_WALLET_WASM_HASH`)

### Physical Security

- [ ] All secrets are in Vercel/Supabase env — no secrets in `.env` files committed to git (`.gitignore` covers this ✅)
- [ ] Funder secret key is a single point of failure — document recovery procedure
- [ ] Confirm Supabase project has MFA enabled for all dashboard users

---

## 5. A4 — Attack Vectors

### Injection Attacks

| Vector | Surface | Current State | Action Required |
|--------|---------|--------------|-----------------|
| SQL injection | Supabase Postgres | Supabase client uses parameterised queries ✅ | Verify no raw SQL in edge functions |
| NoSQL injection | N/A | Not applicable | — |
| Command injection | Deno edge functions | User input not passed to shell ✅ | Audit `contractId` validation in verify-hybrid |
| Contract parameter injection | Soroban calls | `address` validated in airdrop route ✅ | Verify `action` param is whitelist-validated |
| XSS via wallet output | React frontend | React escapes by default ✅ | Audit any `dangerouslySetInnerHTML` usage |

### Social Engineering / Phishing

| Vector | Action |
|--------|--------|
| Fake passkey prompt | Document that the app never requests passkeys outside `zi-playground.vercel.app` — add domain pinning note to UI |
| Malicious QR / deep-link → trigger airdrop drain | Rate-limit `/api/airdrop` and `/api/fund/[address]` immediately |
| Supply chain attack on `@noble/post-quantum` | Lock to exact version, enable Dependabot security alerts |
| Admin key exfiltration | Rotate `FUNDER_SECRET_KEY` on any suspected compromise — document procedure |

### Broken Access Control

| Vector | Surface | Current State | Action Required |
|--------|---------|--------------|-----------------|
| Unauthenticated airdrop drain | `/api/airdrop` | **No auth — CRITICAL** ⚠️ | Add JWT auth check + rate limit |
| Unauthenticated fund endpoint | `/api/fund/[address]` | **No auth — HIGH** ⚠️ | Add JWT auth check + rate limit |
| `users_insert_service` allows `anon` role | RLS policy | Anon can insert users | Tighten — only `service_role` should insert |
| Leaderboard score injection | `scores` table | Service role only inserts ✅ | Verify edge function validates user JWT before writing |
| PQC public key substitution | `verify-hybrid` | Checks DB-stored key vs submitted key? | **Audit**: ensure server fetches key from DB, not trusts client-submitted `pqcPublicKey` |
| Replay of hybrid proof | `verify-hybrid` | 5-minute TTL check ✅ | Verify `issuedAt` is validated strictly server-side |
| Privilege escalation via JWT | All edge functions | `auth.role()` used in RLS | Audit all edge functions validate JWT before DB writes |

### Denial of Service

| Vector | Surface | Action |
|--------|---------|--------|
| Airdrop endpoint spam (funder balance drain) | `/api/airdrop` | **Add rate limiting immediately** |
| Fund endpoint spam | `/api/fund/[address]` | **Add rate limiting immediately** |
| Edge function CPU exhaustion | Auth function (WebAuthn verify) | Timeout wrapper exists — verify it fires |
| Soroban RPC flood | via swap/rewards | Add request queuing / backpressure |
| IndexedDB overflow (client) | Browser | Limit stored PQC key entries to one per contract |

---

## 6. STRIDE Threat Table

*Apply to all data-flow interactions. Unique IDs for tracking.*

### 6.1 What are we working on?

Zi Playground: browser → Next.js API / Supabase Edge → Postgres → Stellar chain.  
See Section 1 for data flow diagram.

### 6.2 Threat Identification

| STRIDE Category | ID | Threat | Affected Component |
|----------------|----|--------|--------------------|
| **Spoofing** | Spoof.1 | Attacker replays a captured WebAuthn credential from another device | `auth` edge function |
| **Spoofing** | Spoof.2 | Attacker submits a PQC proof with a different `pqcPublicKey` than stored in DB, bypassing server-side key binding | `verify-hybrid` edge function |
| **Spoofing** | Spoof.3 | Attacker impersonates admin by guessing or stealing `FUNDER_SECRET_KEY` | `/api/airdrop`, `/api/fund` |
| **Tampering** | Tamper.1 | Attacker modifies `action` parameter in airdrop POST to claim larger reward | `/api/airdrop/route.ts` |
| **Tampering** | Tamper.2 | Attacker tampers with client-side `hybrid-pqc.ts` IndexedDB entry to substitute their own PQC key | Browser / `zi-pqc-vault` IDB |
| **Tampering** | Tamper.3 | Supply-chain compromise injects malicious code into `@noble/post-quantum` | Build pipeline |
| **Repudiation** | Repudiate.1 | User denies having claimed a reward — no signed receipt stored on-chain or in DB | `rewards` edge function |
| **Repudiation** | Repudiate.2 | No audit log for admin contract operations (`distribute_reward`, `add_game_type`) | Soroban contract |
| **Information Disclosure** | Info.1 | `FUNDER_SECRET_KEY` accidentally logged in Vercel function logs | `/api/airdrop`, `/api/fund` |
| **Information Disclosure** | Info.2 | `CORS: *` on `verify-hybrid` allows any origin to probe the validation endpoint | `verify-hybrid` |
| **Information Disclosure** | Info.3 | Missing CSP header allows injected scripts to exfiltrate IndexedDB PQC keys | All pages |
| **Information Disclosure** | Info.4 | Supabase `scores` table has `FOR SELECT USING (true)` — all scores visible unauthenticated | RLS policy |
| **Denial of Service** | DoS.1 | No rate limiting on `/api/airdrop` — attacker drains funder wallet via repeated calls | `/api/airdrop` |
| **Denial of Service** | DoS.2 | No rate limiting on `/api/fund/[address]` — attacker floods any address | `/api/fund` |
| **Denial of Service** | DoS.3 | Large ML-DSA-65 public key (1952 bytes) stored per user — DB storage attack via mass registration | Supabase `users` |
| **Elevation of Privilege** | Elev.1 | `users_insert_service` RLS policy permits `anon` role to insert user rows | `users` table |
| **Elevation of Privilege** | Elev.2 | Stolen Supabase service role key bypasses all RLS — full DB access | Supabase project |
| **Elevation of Privilege** | Elev.3 | Smart contract admin key compromise allows attacker to drain entire ZITOKEN pool | Soroban contract |

### 6.3 What are we going to do about it?

| ID | Remediation |
|----|-------------|
| Spoof.1.R.1 | `auth` edge function must verify the authenticator counter increments on each assertion — already partially in place; confirm counter column is checked |
| Spoof.2.R.1 | `verify-hybrid` must fetch `pqc_public_key` from Supabase DB by `contractId` and ignore the client-submitted `pqcPublicKey` entirely |
| Spoof.3.R.1 | Add JWT auth middleware to `/api/airdrop` and `/api/fund`; only authenticated users may call these |
| Spoof.3.R.2 | Rotate `FUNDER_SECRET_KEY` immediately if suspicious transactions are observed; add monitoring alert |
| Tamper.1.R.1 | Whitelist valid `action` values (1, 2, 3) in `/api/airdrop/route.ts`; reject anything else with 400 |
| Tamper.2.R.1 | Accepted by design — AES-GCM encryption ties the blob to the passkey credential ID. Document this in threat model. |
| Tamper.3.R.1 | Pin all security-critical packages to exact versions (`0.1.2` not `^0.1.2`). Enable `pnpm audit` in CI |
| Repudiate.1.R.1 | Store a signed claim receipt (challenge hash + timestamp + user contract ID) in `rewards` table on every claim |
| Repudiate.2.R.1 | Stellar ledger provides immutable event log — document how to query `distribute_reward` events via Stellar Explorer |
| Info.1.R.1 | Audit all `console.log` / `console.error` calls in API routes — ensure no env vars are logged |
| Info.2.R.1 | Change `CORS_HEADERS` in `verify-hybrid` to `Access-Control-Allow-Origin: https://zi-playground.vercel.app` |
| Info.3.R.1 | Add `Content-Security-Policy` header to `vercel.json` restricting scripts to `'self'` |
| Info.4.R.1 | Accept as intended (public leaderboard). Document this decision explicitly |
| DoS.1.R.1 | Add `upstash/ratelimit` or Vercel Edge Middleware rate limiting to `/api/airdrop` (max 3 req/min per IP) |
| DoS.2.R.1 | Same rate limiting as DoS.1.R.1 for `/api/fund/[address]` |
| DoS.3.R.1 | Add a registration rate limit per IP in the `auth` edge function |
| Elev.1.R.1 | Change `users_insert_service` policy: remove `OR auth.role() = 'anon'` — only `service_role` should insert |
| Elev.2.R.1 | Enable Supabase MFA for all dashboard users. Rotate service role key if any exposure suspected |
| Elev.3.R.1 | Move smart contract admin to a multi-sig or hardware wallet key before mainnet. Document current SPOF risk |

### 6.4 Did we do a good job? (Complete after audit)

- [ ] Data flow diagram referenced and accurate?
- [ ] All S, T, R, I, D, E categories have at least one identified threat?
- [ ] All remediations from 6.3 implemented and verified?
- [ ] Post-implementation issues discovered?
- [ ] Process improvements for next audit?

---

## 7. ISO 27001 Control Checklist

*Based on ISO/IEC 27001:2022 Annex A controls relevant to a web3 / cloud-native app.*

### A.5 — Organisational Controls

| Control | Ref | Status | Action |
|---------|-----|--------|--------|
| Information security policies documented | A.5.1 | ⬜ | Create `SECURITY AUDITS/POLICY.md` |
| Roles and responsibilities defined | A.5.2 | ⬜ | Document who owns each secret/key |
| Threat intelligence | A.5.7 | ⬜ | Subscribe to Stellar security advisories |
| Information security in project management | A.5.8 | ⬜ | Add security review gate to PR template |

### A.6 — People Controls

| Control | Ref | Status | Action |
|---------|-----|--------|--------|
| Confidentiality agreements | A.6.6 | ⬜ | Ensure all contributors have signed NDAs |
| Remote working security | A.6.7 | ⬜ | VPN policy for accessing Supabase/Vercel dashboards |

### A.8 — Technological Controls

| Control | Ref | Status | Action |
|---------|-----|--------|--------|
| User endpoint devices | A.8.1 | ⬜ | Ensure dev machines have disk encryption |
| Privileged access management | A.8.2 | ⬜ | MFA on Vercel + Supabase ✅ (confirm); rotate keys on offboarding |
| Information access restriction | A.8.3 | ⬜ | RLS policies deployed ✅; fix `anon` insert issue |
| Access to source code | A.8.4 | ⬜ | Repo is public — ensure secrets never in code |
| Secure authentication | A.8.5 | ✅ | WebAuthn passkey + hybrid PQC implemented |
| Capacity management | A.8.6 | ⬜ | Rate limiting on API routes (see DoS remediations) |
| Protection against malware | A.8.7 | ⬜ | `pnpm audit` in CI |
| Management of technical vulnerabilities | A.8.8 | ⬜ | Enable GitHub Dependabot; schedule monthly `pnpm audit` |
| Configuration management | A.8.9 | ⬜ | All infra config in git (`vercel.json`, migrations) ✅ |
| Deletion of information | A.8.10 | ⬜ | Document data deletion flow for offboarding users (GDPR if applicable) |
| Data masking | A.8.11 | ⬜ | Ensure passkey private keys never enter logs |
| Data leakage prevention | A.8.12 | ⬜ | Add CSP header; restrict CORS origin |
| Monitoring activities | A.8.16 | ⬜ | Set up Vercel log drains / Supabase log alerts |
| Web filtering | A.8.23 | ⬜ | Verify Vercel WAF rules |
| Use of cryptography | A.8.24 | ✅ | AES-GCM (IndexedDB), HKDF-SHA-256, ML-DSA-65, secp256r1 |
| Secure development lifecycle | A.8.25 | ⬜ | Add security code review to PR checklist |
| Security testing | A.8.29 | ⬜ | Schedule penetration test before mainnet |
| Security in supplier relationships | A.8.30 | ⬜ | Review Mercury, OpenZeppelin relayer SLAs |
| Security event management | A.8.15 | ⬜ | Define incident response playbook |
| Backup | A.8.13 | ⬜ | Enable Supabase daily backups (pro tier required) |

---

## 8. Smart Contract Audit Checklist

**Contract:** Game Reward Contract (Soroban/Rust)  
**File:** `docs/contracts/code/airdrop_contract.rs`  
**Deployed hash:** `24827d1dff98a2706428d6cb80b458e868aea72a5acb9887d2b78f137c39e191`

### Access Control

- [ ] `initialize` function: can only be called once — verify one-time lock is enforced
- [ ] `add_game_type`: verify only the stored admin address can call this
- [ ] `distribute_reward`: verify only admin can call; user cannot call directly
- [ ] No function selector collisions — verify all entry points have distinct identifiers

### Token Safety

- [ ] `distribute_reward` checks contract has sufficient ZITOKEN balance before transfer
- [ ] No integer overflow on reward amounts (Soroban uses i128 — verify bounds)
- [ ] Verify trustline requirement is enforced: recipient must have ZITOKEN trustline before receiving reward
- [ ] Re-entrancy: Soroban is non-reentrant by design ✅ — document this

### Event Logging

- [ ] `distribute_reward` emits a ledger event — verify event schema is indexed by Mercury
- [ ] Admin operations (`add_game_type`) emit events for audit trail

### Upgrade / Admin Key Risk

- [ ] Document that WASM is currently not upgradeable (no `upgrade` entrypoint) — if it is, restrict to admin
- [ ] `FUNDER_SECRET_KEY` = single point of failure for entire contract. **Before mainnet:** migrate to multi-sig (Stellar threshold signatures or separate admin contract)

### Fuzz / Unit Tests

- [ ] Run `cargo test` on contract — verify all tests pass
- [ ] Fuzz `distribute_reward` with edge-case amounts (0, max_i128, negative IDs)
- [ ] Test with invalid game IDs — should return error, not panic

---

## 9. Pre-identified Issues from Code Review

*These were found during the codebase scan on 24 April 2026 and should be addressed first.*

| Priority | ID | File | Issue | Fix |
|----------|-----|------|-------|-----|
| 🔴 CRITICAL | P01 | `src/app/api/airdrop/route.ts` | No authentication — any caller can drain funder wallet | Add JWT auth + rate limit |
| 🔴 CRITICAL | P02 | `src/app/api/fund/[address]/route.ts` | No authentication — any caller can fund any address | Add JWT auth + rate limit |
| 🔴 CRITICAL | P03 | `supabase/functions/verify-hybrid/index.ts` | Trusts client-submitted `pqcPublicKey` — must fetch from DB | Fetch `pqc_public_key` from `users` table by `contractId` |
| 🟠 HIGH | P04 | `supabase/migrations/20260424104820_enable_rls_existing_tables.sql` | `users_insert_service` allows `anon` role to insert users | Remove `OR auth.role() = 'anon'` |
| 🟠 HIGH | P05 | `supabase/functions/verify-hybrid/index.ts` | `Access-Control-Allow-Origin: *` | Restrict to `https://zi-playground.vercel.app` |
| 🟠 HIGH | P06 | `vercel.json` | No `Content-Security-Policy` header | Add CSP restricting scripts/frames |
| 🟡 MEDIUM | P07 | `src/lib/localKeyStorage.ts` | Unknown key storage path — audit whether this stores private keys insecurely | Review and remove or encrypt |
| 🟡 MEDIUM | P08 | `package.json` | `@noble/post-quantum` may use `^` semver — supply chain risk | Pin to exact version |
| 🟡 MEDIUM | P09 | All edge functions | No rate limiting on registration/auth | Add IP-based rate limit in auth edge function |
| 🟢 LOW | P10 | `vercel.json` | HSTS header absent | Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| 🟢 LOW | P11 | Supabase project | Daily backups not confirmed | Enable via Supabase Pro dashboard |
| 🟢 LOW | P12 | Funder keypair | Single EOA key manages all contract ops | Plan multi-sig migration before mainnet |

---

## 10. Audit Sign-off

| Phase | Auditor | Date | Status |
|-------|---------|------|--------|
| Code review (backend) | | | ⬜ |
| Code review (smart contract) | | | ⬜ |
| Code review (frontend / PQC) | | | ⬜ |
| STRIDE review | | | ⬜ |
| ISO 27001 gap analysis | | | ⬜ |
| Penetration test | External | Before mainnet | ⬜ |
| Final sign-off | | | ⬜ |

---

*Next file to create: `SECURITY AUDITS/PENETRATION-TEST-SCOPE.md` when ready to engage an external tester.*
