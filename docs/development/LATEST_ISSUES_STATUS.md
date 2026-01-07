# Latest Issues Status Report

> **Status:** Active Integration & Stabilization Phase
> **Last Updated:** January 6, 2026
> **Context:** This document outlines the critical issues, integration gaps, and architectural flaws identified and resolved during the latest round of comprehensive development for the `zi-playground` application.

---

## 🚀 PROJECT STATUS OVERVIEW

**Phase 1 (Fixes) & Phase 3 (Core Features) Integration Complete**

The codebase has been updated to fully utilize the Airdrop contracts, Soroban wrapper contract, and the zi-classic-asset token, as phase 1 suggested that we need to fix airdrop api, trustline/xdr issues and hooks crash. Airdrop contract correctly deployed and integrated to the backend and now the mechanism working as intended for Zi tokens. XDR and trustline issues were caused because there wasn't proper XDR conversion methods in place, so we added those and now we're hitting a contract call for every new wallet to create a trustline for zi-tokens successfully. As for hooks crash, most of the hooks crash have been fixed successfully, and hooks crash wasn't some 1 thing in general, it was a collection of a bunch of stuff including XDR Conversions, Balance Fetching, Trustline creations, passkey Implementation, Sending/Recieving Zi-Tokens(which were part of phase3 basically) were all broken/crashing So it wasn't just phase1 that we had to fix and work on. We successfully added the trustline creation, Sending/Recieving Zi-tokens also QR Scanning support working, balance fetching mechanism, dropping airdrop successfully upon particles airdrop etc, functionality have been added. Meaning in order to fix phase1 fixes we couldn't really do these without meddling with upcoming Phases like Phase3 includes send/recieve + qr support. Passkey ID Implementation has also been fixed and now it's truly secure and it isn't really at a security risk anymore.

---

## 🛠️ SPECIFIC TECHNICAL FIXES (Jan 6, 2026)

*The following specific issues have been resolved to stabilize the application.*

### 1. 🔌 Wallet Detection and Signing Priority
*   **Problem:** Transactions were signed with PasskeyID even when Freighter/Lobstr was active, because detection relied on localStorage instead of the active connector.
*   **Fix:** Detects wallet type from activeConnector?.id with priority: Freighter/Lobstr → PasskeyID → fallback. Ensures each wallet uses its own signing method.
*   **Files:** `src/lib/contract-fe.ts`

### 2. 🔐 WebAuthn Authentication on Reconnection
*   **Problem:** Reconnection bypassed WebAuthn authentication, allowing wallet access without PIN/biometric verification.
*   **Fix:** Requires WebAuthn authentication with userVerification: "required" before reconnecting. Users must complete PIN/biometric verification.
*   **Files:** `src/lib/passkeyClient.ts`

### 3. 🛡️ WebAuthn Registration on Wallet Creation
*   **Problem:** Wallet creation didn't explicitly require PIN/biometric verification; passkey-kit's createWallet() may not enforce it.
*   **Fix:** Added explicit WebAuthn registration with userVerification: "required" before wallet creation, ensuring PIN/biometric is always required.
*   **Files:** `src/lib/passkeyClient.ts`

### 4. ✅ C-address (Smart Contract) Validation
*   **Problem:** Airdrop route only validated G-addresses, rejecting C-addresses (smart contract wallets).
*   **Fix:** Added validation for both G-addresses (traditional) and C-addresses (contract wallets). Separate handling for C-address vs G-address in transaction building.
*   **Files:** `src/app/api/airdrop/route.ts`, `src/lib/contract-fe.ts`

### 5. 💰 C-address Transaction Source Handling
*   **Problem:** Transaction building used G-address account logic for C-addresses, causing source account errors.
*   **Fix:** Separate source account handling: C-addresses use default account for building (contract signs), G-addresses use traditional account loading.
*   **Files:** `src/lib/contract-fe.ts`

### 6. 🐛 Passkey Wallet Initialization on Reconnect
*   **Problem:** account.wallet wasn't initialized when reconnecting, causing signing failures.
*   **Fix:** Added initializeWallet() helper that initializes account.wallet with contractId when reconnecting or before signing.
*   **Files:** `src/lib/passkey-kit.ts`, `src/lib/contract-fe.ts`, `src/lib/passkeyClient.ts`

### 7. 🔑 Passkey Storage Methods
*   **Problem:** No dedicated storage methods for passkey keyId and contractId, leading to inconsistent storage.
*   **Fix:** Added storePasskeyKeyId(), getPasskeyKeyId(), storePasskeyContractId(), getPasskeyContractId() methods to LocalKeyStorage.
*   **Files:** `src/lib/localKeyStorage.ts`

### 8. 🚨 C-address Recipient Error Handling
*   **Problem:** Sending tokens to C-address recipients failed with unclear errors about balance initialization.
*   **Fix:** Added detection for C-address recipients and improved error messages explaining balance storage initialization requirements.
*   **Files:** `src/services/contract.ts`

### 9. ⚙️ Environment Variables Configuration
*   **Problem:** Missing environment variables for passkey-kit configuration (RPC URL, network passphrase, wallet WASM hash, LaunchTube URL/JWT).
*   **Fix:** Added all required environment variables to .env.development for passkey-kit and LaunchTube integration.
*   **Files:** `.env.development`

### 10. ⛓️ Lobstr Trustline Issue
*   **Issue:** Unable to fetch ZION token balance when connected with lobstr.
*   **Technical Findings:** Missing trustline for ZION token and lobstr wallet.
*   **Fixes:** Created trustline for ZION token and lobstr wallet.
*   **File updated:** `src/services/contract.ts`

### 11. 💸 Airdrop Claim Fixes
*   **Issue:** Airdrop claim was unsuccessful.
*   **Technical Findings:**
    *   Contract function parameters had incorrect parsing leading to a fail transaction.
    *   Usage of server side and client side libraries at the same time leading to failed transaction.
    *   Transaction was not converted to XDR format causing the transaction to not be included in the block.
*   **Fixes:**
    *   Updated parsing for both the parameters, scValAddress for address and scVal for game number.
    *   Updated the code to consume only server side library to execute transaction smoothly.
    *   Converted the transaction to XDR format, so that it can be added to the block after successful simulation.
    *   Utilized a package alias (`stellar-sdk-v14`) to use Stellar SDK v14 for the airdrop functionality, while maintaining backward compatibility with v12 in the rest of the application.
*   **File updated:** `src/app/api/airdrop/route.ts`, `src/lib/contract.ts`, `package.json`

### 12. 🗝️ Passkey Recovery from Password Managers
*   **Problem:** If `localStorage` was cleared, there was no way to reconnect to an existing passkey wallet, forcing users to create a new one.
*   **Fix:** Implemented a factory contract pattern. The application now leverages the browser's native WebAuthn API to discover and recover passkeys stored in password managers (like Google Password Manager, iCloud Keychain, etc.), linking them back to the user's on-chain wallet.
*   **Files:** `src/lib/passkeyClient.ts`, `.env.development`

---

## 🚦 PHASE STATUS REPORT

### Phase 1: Fixes (✅ COMPLETED)
*   **Resolve hooks crash:** ✅ Fixed via stabilization of balance fetching, XDR conversion, and wallet hooks (`useAirdrop`, `useAssets`, `useWallets`).
*   **Repair Airdrop API:** ✅ Fixed. Backend now successfully communicates with the Airdrop contract and distributes tokens.
*   **Implement Trustlines and XDR support:** ✅ Fixed. Robust XDR conversion helpers added; trustlines created automatically for ZION tokens.
*   **Passkey Migration:** ✅ Fixed. Secure flow implemented with WebAuthn enforcement.

### Phase 2: Soroswap Integration (🚧 PENDING)
*   **Integrate Soroswap:** Pending.
*   **Liquidity (LP) Functionality:** Pending.
*   **Update Contracts/UI:** Pending.

### Phase 3: Core Features (⚠️ PARTIALLY COMPLETED)
*   **Implement Send/Receive using QR + Stellar SDK:** ✅ **COMPLETED.** Users can now send and receive ZI tokens using the integrated QR scanner and corrected SDK logic.
*   **Add Airdrops and Referrals via Zion contract:** ✅ **COMPLETED.** Airdrop mechanism is fully operational.
*   **Integrate Games:** (Partially Completed - Particles airdrop active).
*   **Build Leaderboard Modal:** Pending.
*   **Add Lottie Icon animation:** Pending.

---

## 🚨 UPDATED SYSTEM STATUS

### 1. React Hooks & Systemic Stability
**Severity:** 🟢 STABLE
**Status:** ✅ RESOLVED
The recursive crashes caused by malformed XDR and trustline failures have been resolved. The application is now stable during wallet connection and data fetching.

### 2. Airdrop & Rewards System
**Severity:** 🟢 STABLE
**Status:** ✅ FUNCTIONAL
The backend correctly simulates, signs, and submits airdrop transactions. The system correctly utilizes different versions of the Stellar SDK for modern and legacy code, ensuring compatibility.

### 3. Passkey Security
**Severity:** 🟢 SECURE
**Status:** ✅ IMPLEMENTED
The system now enforces WebAuthn protocols for all operations and supports secure wallet recovery from password managers (e.g., Google Password Manager), eliminating the need for users to store session data locally.

---

## 📝 Next Steps (Phase 2 Focus)

With Phase 1 fixes complete and critical Phase 3 features (Send/Receive) integrated to support the testing flow, the focus now shifts to **Phase 2: Soroswap Integration**.

1.  **Soroswap Integration:** Begin integration of Swaps for Zi ↔ XLM.
2.  **Liquidity Pools:** Implement UI and logic for adding/removing liquidity.
3.  **Game Expansion:** Enable airdrop logic for Tetris and Space Invaders.