# Security Phase 1 Report — June 2026

**Prepared for:** Saad Hassan (UI Lead / Core Dev)  
**Date:** 11 June 2026  
**Commit:** `6547f35`  
**Branch:** `main` — pull with `git pull origin main`

---

## Summary

Phase 1 dependency security upgrades are complete and pushed to remote.

| Metric | Before | After |
|---|---|---|
| Snyk issues | 50 | **27** |
| Vulnerable paths | 477 | **57** |
| Critical issues resolved | 2 | 0 remaining from Phase 1 scope |
| High issues resolved | ~10 | 0 remaining from Phase 1 scope |

All remaining 27 issues require a **Next.js major upgrade** — this is **Phase 2 (your task)**.

---

## What was upgraded (Phase 1 — done)

| Package | From | To | Vulnerabilities fixed |
|---|---|---|---|
| `axios` | 1.13.2 | 1.15.2 | Critical prototype pollution, SSRF, HTTP response splitting, CRLF injection |
| `@supabase/supabase-js` | 2.49.4 | 2.50.0 | Medium: auth-js directory traversal |
| `@react-three/drei` | 9.120.5 | 9.120.9 | Medium: uuid transitive |
| `uuid` | 11.1.0 | 11.1.1 | Medium: index validation |
| `lodash` | 4.17.21 | 4.18.1 | High: prototype pollution × 2, arbitrary code injection |
| `@chakra-ui/react` | 3.3.1 | 3.8.2 | High: zag-js prototype pollution |
| `recharts` | 2.15.3 | 3.0.0 | Medium: lodash transitive, also needed for @chakra-ui/charts peer dep |

### Additional fixes in this commit

- **`next.config.mjs`** — Added webpack `resolve.alias` to fix a module resolution crash introduced by pnpm hoisting `passkey-kit`'s bundled `@stellar/stellar-sdk@14`. Without this the build fails with `Module not found: Can't resolve '../../package.json'`.
- **`src/lib/hybrid-pqc.ts`** — `fromBase64url()` now returns `Uint8Array<ArrayBuffer>` (explicit type). TypeScript 5.9 introduced stricter `BufferSource` checks — the old `Uint8Array.from()` returned `Uint8Array<ArrayBufferLike>` which fails `crypto.subtle.encrypt/decrypt`. Fixed with an explicit loop-fill into a fresh `new Uint8Array(n)`.
- **`src/lib/hybrid-pqc.ts`** — `encryptSecretKey()` now copies `secretKey` into a guaranteed `ArrayBuffer`-backed `Uint8Array` before passing to `crypto.subtle.encrypt`.

---

## Phase 2 — Your task (Next.js upgrade)

All 27 remaining Snyk issues are in `next@14.2.22`. Snyk recommends upgrading to `next@16.1.7` but `next@15.x` is the safer step.

### Issues blocked on Next.js upgrade

| Severity | Count | Examples |
|---|---|---|
| Critical | 1 | Improper Authorization (SNYK-JS-NEXT-9508709) |
| High | 9 | SSRF × 2, DoS/throttling × 5, Deserialization, Incorrect Authorization |
| Medium | 14 | XSS × 3, HTTP Request Smuggling, Race Condition, Cache info leak, ReDoS, postcss XSS |
| Low | 3 | WebSocket origin, missing source correlation, XSS |

### Upgrade path recommendation

```bash
# Step 1 — upgrade Next.js to 15 (not 16 — too new/untested with our stack)
pnpm update next@15 eslint-config-next@15

# Step 2 — run the Next.js codemod for App Router breaking changes
npx @next/codemod@latest upgrade

# Step 3 — build and fix any TypeScript/config errors
pnpm build

# Step 4 — full regression test
# - Connect passkey wallet
# - Airdrop flow (Particle + Atomic)
# - Tetris game → leaderboard → ZI reward in balance modal
# - Space Invaders → same
# - Swap modal
# - Services modal → Info modal

# Step 5 — re-run Snyk
snyk test

# Step 6 — push
git push origin main
```

### Known breaking changes in Next.js 15 to watch for

- `serverComponentsExternalPackages` moved to `serverExternalPackages` in `next.config`
- `headers()`, `cookies()`, `params` in Route Handlers are now async — need `await`
- Some `next/navigation` hooks changed behaviour
- Turbopack is now default for `next dev` — may surface new warnings

---

## Remaining items after Phase 2 (for external audit prep)

1. `sha.js@2.4.11` — Critical, in `@stellar/stellar-sdk@12` → `@stellar/stellar-base@12.1.1`. **No direct fix yet** — requires upstream Stellar SDK to update `sha.js` to `2.4.12`. Monitor [stellar-sdk releases](https://github.com/stellar/js-stellar-sdk/releases).
2. Smart contract audit — Soroban airdrop + game reward contracts need separate review.
3. Supabase RLS audit — confirm all tables have correct policies for mainnet (scores, rewards, users, challenges).
4. Passkey / WebAuthn session audit — confirm no session fixation vectors.
5. API rate limiting audit — fund, airdrop, game-reward routes.

---

## External audit readiness timeline

| Phase | Status | Target |
|---|---|---|
| Phase 1 deps ✅ | **Complete** | June 11 2026 |
| Phase 2 Next.js upgrade | **Your task** | June 18 2026 |
| Phase 3 audit prep docs | After Phase 2 | June 20 2026 |
| External audit begins | — | June 23 2026 |
| Fix audit findings | — | July 4 2026 |
| **Audit sign-off** | — | **July 7 2026** |

---

## Run Snyk yourself

```bash
# Ensure authenticated
snyk auth

# Run scan
snyk test

# Expected after Phase 2: <5 issues (only sha.js upstream + any new findings)
```
