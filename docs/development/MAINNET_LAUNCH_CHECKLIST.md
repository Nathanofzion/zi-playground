# Mainnet Launch Checklist

> **Status**: Currently running on **Stellar Testnet**. This document tracks everything that must be done before going live on Mainnet.

---

## 🔴 Critical — Security (Must Do Before Mainnet)

### 1. Remove `.env` files from git tracking

**Problem**: `.env.development`, `.env.production`, and `supabase/.env.development` are currently committed to git history. This is acceptable for testnet but is a **hard blocker** for mainnet — private keys and JWTs must never be in version control for a production deployment.

**Action required**:
```bash
git rm --cached .env.development .env.production supabase/.env.development
echo ".env.development" >> .gitignore
echo ".env.production" >> .gitignore
git add .gitignore
git commit -m "security: untrack env files with secrets"
git push origin main
```

After doing this, all secrets live only in the Vercel dashboard (Settings → Environment Variables) and locally in non-tracked `.env.*` files.

### 2. Rotate `FUNDER_SECRET_KEY`

**Problem**: The current `FUNDER_SECRET_KEY` in `.env.production` (`SA54HW...`) has been committed to git history and must be treated as **compromised** before mainnet. Any key that has ever been in git should never be used with real funds.

**Action required**:
- Generate a new Stellar mainnet keypair
- Fund the new account with XLM
- Replace the key in Vercel env vars
- Never commit the new key to git

### 3. Rotate `MERCURY_JWT`

**Problem**: The Mercury JWT has been committed to git. The current testnet JWT expired April 2025, but whatever mainnet JWT is used must be stored only in Vercel and never committed.

**Action required**:
- Generate a fresh JWT from the [Mercury dashboard](https://api.mercurydata.app)
- Store only in Vercel env vars

---

## 🟡 Infrastructure — Swap from Testnet to Mainnet

### 4. Update all contract addresses

All current contract IDs point to **Stellar testnet**. These must be replaced with mainnet-deployed contracts.

| Variable | Current Testnet Value | Mainnet Value |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-mainnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| `NEXT_PUBLIC_SOROSWAP_ROUTER` | `CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD` | TBD — mainnet Soroswap router |
| `NEXT_PUBLIC_SOROSWAP_FACTORY` | `CDP3HMUH6SMS3S7NPGNDJLULCOXXEPSHY4JKUKMBNQMATHDHWXRRJTBY` | TBD — mainnet Soroswap factory |
| `NEXT_PUBLIC_AIRDROP_CONTRACT_ID` | `CB4ZMY6Z3666S4HRDUZQGUIUL63GNVMXA7PEMBFSKAFOIH32LXBSEVUS` | TBD — redeploy to mainnet |
| `NEXT_PUBLIC_FACTORY_CONTRACT_ID` | `GC2C7AWLS2FMFTQAHW3IBUB4ZXVP4E37XNLEF2IK7IVXBB6CMEPCSXFO` | TBD — mainnet passkey factory |
| `NEXT_PUBLIC_WALLET_WASM_HASH` | `ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90` | TBD — redeploy passkey wallet WASM |

### 5. Update OpenZeppelin relayer to mainnet

**Current**: `https://channels.openzeppelin.com/testnet`  
**Mainnet**: `https://channels.openzeppelin.com/mainnet`  
**API Key**: Get a production API key from [OpenZeppelin Defender](https://defender.openzeppelin.com/)

### 6. Redeploy smart contracts to mainnet

- Airdrop contract (`NEXT_PUBLIC_AIRDROP_CONTRACT_ID`)
- Passkey smart wallet WASM (`NEXT_PUBLIC_WALLET_WASM_HASH`)
- Update `NEXT_PUBLIC_FACTORY_CONTRACT_ID` with mainnet passkey factory

---

## 🟡 Infrastructure — Services

### 7. Mercury indexing — mainnet project

The current Mercury project (`zi-playground`) indexes testnet data. A separate mainnet Mercury project must be created and a new JWT obtained.

- Mercury URL stays the same: `https://api.mercurydata.app`
- New project name and JWT required

### 8. Supabase — review RLS policies

Current Supabase project (`bjuczpbbbtfvalyetphr.supabase.co`) needs:
- Row Level Security (RLS) reviewed for production data
- Confirm anon key only has read access where appropriate
- Consider a separate Supabase project for mainnet vs testnet data

### 9. Funder account — mainnet funding

The funder account covers gas fees (`FUNDER_PUBLIC_KEY: GAYW7P7...`) for passkey relaying. On mainnet this account needs to hold real XLM. Monitor its balance and set up alerts for low balance.

---

## 🟢 Vercel Setup (Already Done for Testnet)

These are already in place for the current testnet Vercel deployment and just need the values swapped to mainnet equivalents:

- [x] `vercel.json` created with `pnpm build` / `pnpm install`
- [x] Build passes cleanly (`pnpm build` exits 0)
- [x] All TypeScript/ESLint errors resolved (commit `1ffe665`)
- [ ] Vercel project connected to repo
- [ ] All env vars entered in Vercel dashboard
- [ ] Production branch set to `main` in Vercel git settings

---

## Deployment Flow (Once Ready)

```
testnet branch (soroswap-integration) 
    → preview deploy on Vercel (auto)
    → test everything works
    → PR #41: soroswap-integration → main
    → merge = production deploy on Vercel (auto)
```

---

## Summary — Testnet vs Mainnet Differences

| | Testnet (Now) | Mainnet (Launch) |
|---|---|---|
| Network | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| RPC | `soroban-testnet.stellar.org` | `soroban-mainnet.stellar.org` |
| Relayer | `.../testnet` | `.../mainnet` |
| Funder | Test XLM (free) | Real XLM required |
| Contracts | Testnet deploys | Must redeploy to mainnet |
| Secrets in git | ⚠️ Yes (testnet only, acceptable short-term) | ❌ Must be removed |
| Private keys | Test keys only | Must rotate — testnet keys are compromised |
