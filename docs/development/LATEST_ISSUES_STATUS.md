# Latest Issues Status Report

> **Status:** Active Investigation & Integration Phase  
> **Last Updated:** December 10, 2025  
> **Context:** This document outlines the critical issues, integration gaps, and architectural flaws identified during the latest round of comprehensive testing for the `zi-playground` application.

---

## 🚨 Critical System Failures

### 1. React Hooks & Systemic Crashes
**Severity:** 🔴 CRITICAL  
**Module:** Frontend (Hooks), Backend (API)  
**Status:** ⚠️ PARTIALLY RESOLVED / IN PROGRESS

*   **Status Update:** Significant progress has been made in stabilizing the frontend hooks. The "Nested button hydration warning" has been fixed by properly using the `asChild` prop in components.
*   **Infinite Retry Loops:** The application still requires fail-safe checks to prevent infinite retry loops when backend requests fail.
*   **3D Canvas Performance:** The interactive 3D background on the home screen remains a source of instability (excessive resource usage) and requires optimization (object pooling, particle limits).

### 2. Supabase Edge Function Stability
**Severity:** 🔴 CRITICAL  
**Module:** Backend (Supabase)  
**Status:** ❌ BROKEN

*   **Status Update:** Backend functions (`auth`, `rewards`) are still returning 546/500 errors.
*   **Root Cause:** The functions are likely crashing or timing out ("CPU time limit reached") because the local Supabase Edge Runtime is not running or the functions are still using the incorrect `Deno.serve` architecture.
*   **Impact:** User authentication and reward claiming remain unreliable until the Edge Functions are properly running and refactored.

---

## 🔐 Security & Authentication

### 3. Passkey Implementation Security Flaws
**Severity:** 🔴 CRITICAL (SECURITY RISK)  
**Module:** Authentication (`src/lib/passkey.ts`)  
**Status:** 🚧 30% IMPLEMENTED / INSECURE

The current Passkey implementation is a functional prototype but is fundamentally insecure:
*   **Insecure Storage:** The user's Stellar **secret key** is generated on the client and stored in the browser's `localStorage`. This exposes the user to total fund theft via XSS attacks.
*   **Missing Backend Logic:** The secure, server-side signing architecture (decrypting keys only in memory) is missing.
*   **Database Gap:** Keys are not being securely encrypted and stored in the database, preventing cross-device usage or account recovery.

---

## 💸 Blockchain & Token Integration Status

### 4. Send/Receive & Data Conversion (MAJOR UPDATES)
**Severity:** 🟢 RESOLVED (Mostly)  
**Module:** Frontend/Blockchain (`src/services/contract.ts`)  
**Status:** ✅ FIXED / TESTED

*   **XDR & Balance Fetching:**
    *   **Fixed:** XDR encoding issues caused by invalid balance fetching have been resolved.
    *   **Fixed:** The `tokenBalance` function in `src/services/contract.ts` has been refactored to use Stellar SDK conversion functions directly, removing unnecessary API calls for simple string-to-contract-data conversions.
    *   **Fixed:** Trustline checks have been added, allowing for successful balance fetching and transfers for both **ZION** and **XLM**.
*   **Send Modal UI:**
    *   **Fixed:** The "Send" modal now correctly displays the ZION and XLM tokens along with their balances (previously empty). Users can successfully send/transfer both tokens.
*   **Receive Functionality:**
    *   **Verified:** Receive functionality has been tested and confirmed working.
    *   **Verified:** The QR code scanner is now working as expected (directing to the correct address).
*   **Data Serialization:**
    *   **Fixed:** ScVal serialization/deserialization (Client Base64 <-> Server ScVal) is fully in place.
    *   **Fixed:** `accountScVal` and `actionScVal` are correctly parsed before `contractInvoke`.
    *   **Fixed:** `BigInt` JSON serialization is now handled correctly.
    *   **Fixed:** The Convert API now returns a 400 error for malformed/empty JSON instead of crashing the server.

### 5. Smart Contract Integration & Testing
**Severity:** 🔴 BLOCKER  
**Module:** Blockchain / Integration  
**Status:** ⚠️ INTEGRATION IN PROGRESS

*   **Status Update:** The **Classic Asset (ZIG)** and **Classic Asset Wrapper** contract are **now being used** for critical features:
    *   Sending tokens.
    *   Fetching balances.
    *   Establishing trustlines.
*   **Airdrop Contract:** The dedicated Airdrop contract has been deployed to Testnet but remains pending full integration with the application logic (backend rewards system).
*   **Flow Testing:** Rigorous testing is still required to verify the end-to-end flow (Frontend -> API -> Smart Contract) now that the contracts are partially active. We anticipate potential issues with XDR encoding and complex trustline verification surfacing during this phase.

### 6. Wallet Connection Stability
**Severity:** 🟠 HIGH
**Module:** Frontend / Wallet (`@soroban-react`)
**Status:** ⚠️ UNSTABLE

*   **Connection Loops:** Users are redirected to the extension download page even when the wallet is installed.
*   **First-Click Failure:** The "Connect" button often fails on the first click, requiring a full application reload (Hot Reload) to work.
*   **No Popup:** On the first connection attempt, the wallet popup often fails to appear.
*   **Technical Issues:**
    *   Inconsistent behavior from the integrated `@soroban-react` library.
    *   The variable indicating wallet presence often returns `true` even when false or disconnected.
    *   Inconsistent state values lead to the "Download Wallet" redirection error.
    *   Connection usually fails if the wallet is not already unlocked/connected within the browser extension itself before loading the app.

### 7. Airdrop & Rewards System
**Severity:** 🔴 BLOCKER  
**Module:** Backend/Blockchain  
**Status:** ❌ BROKEN

*   **Backend Inconsistency:** Game scores are being saved to Supabase, but backend communication is inconsistent and requires debugging.
*   **Reward Distribution:** The logic to save or send rewards (Airdropping) is currently non-functional. It is blocked pending the full integration and flow testing of the newly deployed Airdrop Contract.
*   **Blocked Features:** We are currently unable to proceed with testing Soroswap integration and Liquidity provision until the foundational Airdrop and Token flows are stabilized.

---

## 📝 Summary & Next Steps

The project has reached a critical milestone with the resolution of core XDR and Send/Receive issues. The frontend can now reliably fetch balances and sign transactions for ZION and XLM using the wrapper contract. However, instability in wallet connections and the backend API remain significant hurdles.

**Immediate Priorities:**
1.  **Fix Wallet Connection:** Debug the `@soroban-react` integration to ensure reliable, first-click wallet connections without reloads.
2.  **Integrate Airdrop Contract:** Connect the backend reward logic to the newly deployed Airdrop contract.
3.  **Refactor Backend:** Rewrite Supabase functions to fix the `Deno.serve` timeout issue causing 500 errors.
4.  **Secure Passkeys:** Re-architect the authentication flow to remove secret keys from `localStorage`.
5.  **Stabilize Frontend:** Implement error handling to stop infinite loops and fix the 3D canvas performance issues.