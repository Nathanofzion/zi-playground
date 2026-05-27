# Testnet Reset Incident — May 2026

**Date discovered:** May 25, 2026  
**Root cause:** Stellar testnet reset + post-reset redeployment mismatch  
**Status:** Resolved + hardened (commits `be40b32`, `fe098d8`, `3da7aea`, `815c5ae`)

---

## What Broke

Two separate issues surfaced simultaneously, both traceable to the same root cause: a **Stellar testnet reset** that wiped all on-chain state and required contracts to be redeployed.

### Issue 1 — ZI balance showing 0 in balance modal

**Symptom:** Users who had received ZI via airdrop saw 0 ZI in the balance modal.

**Root cause:**  
After the testnet reset, the ZI Stellar Asset Contract (SAC) was redeployed, producing a new contract address. The app's env var `NEXT_PUBLIC_ZI_SAC_ID` was updated to the *new* SAC, but the **airdrop contract was left pointing at the *old* SAC**. This created two live SAC addresses holding different user balances:

| Label | Contract Address | Who holds ZI here |
|---|---|---|
| **Old SAC** (canonical for airdrop) | `CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC` | Airdrop recipients, game reward earners |
| New SAC (unused by airdrop) | `CDEFQXMFQ3JKHN4FNAIUS6ZSAEQLLKDF43ONNAK4DQ476MFJKE62W6LF` | Nobody (0 balance for all users) |

The balance modal queried the new SAC → always returned 0.

**Fix:** Updated `NEXT_PUBLIC_ZI_SAC_ID` default in `src/constants/zionToken.ts` back to the old SAC (`CBVKFH...`) and updated the Vercel env var to match.

---

### Issue 2 — New account funding (Friendbot) broken

**Symptom:** Creating a new passkey wallet silently failed at the XLM funding step.

**Root cause:**  
After the testnet reset the funder account (`GBNNJVN6...`) was re-funded via Friendbot (10,000 XLM). However, `src/app/api/fund/[address]/route.ts` was still set to send **10,000 XLM per new wallet** — the entire funder balance in a single transfer. After just one or two new wallets were created, the funder was drained to ~7 XLM (below the ledger minimum reserve + fee threshold), causing every subsequent funding attempt to throw a `tx_insufficient_balance` error.

**Initial fix:**
1. Topped up funder via Friendbot → ~18,880 XLM
2. Reduced transfer amount: `nativeToScVal(10000 * 1e7)` → `nativeToScVal(100 * 1e7)` (100 XLM per wallet)

100 XLM is more than enough for a testnet smart wallet to cover fees for years.

**Current behavior (hardened):**
The funding endpoint now tries fallback transfer sizes in order: `10000 → 1000 → 100 → 10 → 1 XLM`.
This prevents onboarding failures when the funder balance is lower than 10,000 XLM.

---

### Issue 3 — Airdrop claims and game leaderboard scores intermittently failing

**Symptoms:**
- Atomic tutorial airdrops failed while Particle claims worked.
- Game scores were not always recorded, and leaderboards stayed empty.

**Root causes:**
1. Airdrop API action whitelist allowed only `1..3` (Particle), but Atomic actions are `4..6`.
2. `scores` table RLS policy allowed insert only for `service_role`, while score function traffic came through anon context.

**Fixes:**
1. Expanded airdrop action whitelist to include `1..6`.
2. Added migration `20260526000001_fix_scores_insert_policy_for_edge_fn.sql` to allow inserts into `public.scores` from the edge function path.
3. Deployed updated score edge function and verified live `create` + `read` requests.

---

### Issue 4 — Balance modal formatting did not show fixed decimal zeros

**Symptom:**
Balance modal values trimmed trailing zeros and did not consistently display fixed decimal precision.

**Example expected display:**
- `Zi 40.00000096`
- `XLM 10000.00000096`

**Fix:**
Updated balance formatting to preserve fixed decimal precision in modal display using raw stroop values.

---

## Why Testnet Resets Cause This

Stellar testnet resets approximately every 3 months (check https://developers.stellar.org/docs/learn/fundamentals/networks). When a reset happens:

- All accounts, balances, and contract state are **wiped to zero**
- Contracts must be **redeployed** — new deployment = new contract address
- The funder account must be **re-seeded** via Friendbot
- All Vercel env vars referencing contract addresses must be **updated**

If different parts of the stack are updated to different new addresses, a mismatch like the one above occurs.

---

## Recovery Checklist (use after any future testnet reset)

1. **Redeploy all contracts** (airdrop, ZI SAC, staking, game reward)
2. **Update ALL contract address env vars in Vercel** — run `vercel env ls` and check every `*_CONTRACT_ID` and `*_SAC_ID` variable
3. **Make sure the airdrop contract and `NEXT_PUBLIC_ZI_SAC_ID` point to the same ZI SAC** — this is the most common mismatch
4. **Re-fund the funder account** via Friendbot: `https://friendbot.stellar.org/?addr=<FUNDER_PUBLIC_KEY>`
5. **Verify funder balance** is healthy and can cover expected signups
6. **Check funding fallback logic** in `src/app/api/fund/[address]/route.ts` (currently `10000/1000/100/10/1` XLM)
7. **Validate all airdrop actions** (`1..6`) return success in API route
8. **Verify score write path** by posting a test score and confirming leaderboard read returns rows
9. **Test end-to-end**: create new wallet → XLM funding → claim airdrop → play both games → leaderboard updates → balance modal shows fixed decimals

---

## Key Addresses (post-May-2026 testnet)

| Resource | Address |
|---|---|
| ZI SAC (canonical) | `CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC` |
| ZI issuer (display only) | `GD2HAM6GOH2EXLKMFRSLUM6FEPEZXHO4GCCJGRNMP3IX4VZ6CZXKD6LU` |
| Airdrop contract | `CB4ZMY6Z3666S4HRDUZQGUIUL63GNVMXA7PEMBFSKAFOIH32LXBSEVUS` |
| Funder account | `GBNNJVN6SBUXH6UXPHFUPWSVSEYQBCAQL4BSXDCEVB3WXIX2NM4HMARP` |
| XLM SAC (testnet) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

> If the testnet resets again, all `C` addresses above will be invalid. `G` addresses (funder) survive resets but lose their balance.

---

## Files Changed in Fixes

| File | Change |
|---|---|
| `src/constants/zionToken.ts` | Default fallback changed from new SAC → old SAC |
| `src/app/api/fund/[address]/route.ts` | Funding logic hardened with fallback amounts (`10000/1000/100/10/1`) |
| `src/app/api/airdrop/route.ts` | Action whitelist expanded to include Atomic actions (`4..6`) |
| `src/hooks/useScore.tsx` | Score query/invalidation keyed by game type to stabilize leaderboard data |
| `src/components/modals/BalanceModal.tsx` | Uses fixed-decimal token formatting for display |
| `src/utils/index.ts` | Added fixed-decimal token formatter behavior |
| `supabase/functions/score/index.ts` | Score function updated for non-fatal reward path and env-key fallback |
| `supabase/migrations/20260526000001_fix_scores_insert_policy_for_edge_fn.sql` | Opened `scores` insert policy for edge-function path |
| Vercel env | `NEXT_PUBLIC_ZI_SAC_ID` updated to old SAC address |
