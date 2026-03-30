# Main Branch Update — March 30, 2026

## Overview

The `soroswap-integration` branch has been fully merged into `main`. All conflicts were resolved in favor of `soroswap-integration`, which is now the authoritative codebase. Going forward, development continues on `main`.

**Merge commit:** `c7e5e01`
**Files changed:** 26 (including 2 new additions)

---

## Key Changes Merged

### 1. Swap — Low Liquidity Error Handling
**Files:** `src/hooks/useSwap.tsx`, `src/components/modals/SwapModal.tsx`, `src/components/modals/LowLiquidityModal.tsx` *(new)*

- Added `getAmountsOut` pre-validation before the user signs a swap. If the pool cannot fulfill the swap, the transaction is blocked before any fees are incurred.
- Set `amountOutMin` to **0.5% slippage tolerance** (`expectedAmountOut × 0.995`) instead of the previous hardcoded `0`.
- Created `LowLiquidityModal` — shown when `Error(Contract, #10)` is detected or `amountOut ≤ 0`. Matches app design system: gradient border (`#a588e4` → `#b7fee0`), light/dark mode, pill buttons.
- Modal displays the requested vs available amounts and includes an "Add Liquidity" CTA that opens the LiquidityModal directly.

### 2. Transaction Confirmation Timeout Fix
**File:** `src/lib/contract-fe.ts`

- `waitForConfirmation` now polls **30 × 3 s = 90 s max** (previously 10 × 2 s = 20 s).
- Timeout returns `null` instead of throwing — prevents false-positive error states on slow networks.
- `isTimeBoundsError` no longer matches on the generic string `"timeout"`, reducing noise.

### 3. PasskeyID CORS Fix
**File:** `src/lib/passkey-kit.ts`

- `setServiceHeaders()` now only sends `X-Turnstile-Response`.
- Removed `X-Client-Version` and `X-Client-Name` headers, which OpenZeppelin Relayer was rejecting with a CORS preflight error.

### 4. WebGL Error Boundary — Earth.tsx
**File:** `src/components/Earth.tsx`

- Added `WebGLErrorBoundary` React Error Boundary class wrapping the Three.js `Canvas`.
- Added `isWebGLSupported()` pre-flight check.
- Graceful fallback UI shown when WebGL is unavailable (e.g., headless browsers, some mobile devices).

### 5. Passkey Client & Local Key Storage Updates
**Files:** `src/lib/passkeyClient.ts`, `src/lib/localKeyStorage.ts`

- Passkey sign-in / sign-up flows updated alongside CORS and relayer fixes.
- Local key storage aligned with updated key derivation and storage format.

### 6. Wallet Modals Refresh
**Files:** `src/components/wallet/PasskeyChoiceModal.tsx`, `src/components/wallet/SimpleWalletModal.tsx`, `src/components/wallet/WalletManagementModal.tsx`

- UI and logic updates consistent with Soroswap integration requirements.

### 7. Hooks — Airdrop, Pairs, Assets
**Files:** `src/hooks/useAirdrop.tsx`, `src/hooks/usePairs.tsx`, `src/hooks/useAssets.tsx`

- Updated to reflect new contract and relayer interaction patterns.

### 8. API Routes
**Files:** `src/app/api/relay/route.ts`, `src/app/api/fund-account/route.ts`, `src/app/api/fund/[address]/route.ts`

- Relay route updated to handle relayer response and timeout changes.
- Fund routes aligned with testnet/mainnet config.

### 9. Vercel & TypeScript Config
**Files:** `vercel.json` *(new)*, `tsconfig.json`

- Added `vercel.json` for deployment configuration.
- `tsconfig.json` updated to match project requirements.

### 10. Miscellaneous
- Added `.eslintignore` to suppress linting on generated/vendor files.
- Added `docs/development/MAINNET_LAUNCH_CHECKLIST.md` for launch tracking.

---

## Resolved Merge Conflicts

All 15 conflicts were resolved in favor of `soroswap-integration`:

| File | Resolution |
|------|-----------|
| `.env.development` | soroswap-integration |
| `src/app/api/relay/route.ts` | soroswap-integration |
| `src/components/common/AddLiquidity.tsx` | soroswap-integration |
| `src/components/common/RemoveLiquidity.tsx` | soroswap-integration |
| `src/components/modals/SwapModal.tsx` | soroswap-integration |
| `src/components/wallet/PasskeyChoiceModal.tsx` | soroswap-integration |
| `src/components/wallet/SimpleWalletModal.tsx` | soroswap-integration |
| `src/components/wallet/WalletManagementModal.tsx` | soroswap-integration |
| `src/hooks/useAirdrop.tsx` | soroswap-integration |
| `src/hooks/usePairs.tsx` | soroswap-integration |
| `src/hooks/useSwap.tsx` | soroswap-integration |
| `src/lib/contract-fe.ts` | soroswap-integration |
| `src/lib/localKeyStorage.ts` | soroswap-integration |
| `src/lib/passkey-kit.ts` | soroswap-integration |
| `src/lib/passkeyClient.ts` | soroswap-integration |

---

## Branch Status

| Branch | Status |
|--------|--------|
| `main` | ✅ Pushed — now matches `soroswap-integration` |
| `soroswap-integration` | ✅ Pushed — fully merged into `main` |

Development continues on `main`.
