# Latest Issues Status Report

> **Status:** Active Investigation & Integration Phase  
> **Last Updated:** December 12, 2025  
> **Context:** This document outlines the critical issues, integration gaps, and architectural flaws identified during the latest round of comprehensive testing for the `zi-playground` application.

---

## ✅ RECENT TECHNICAL FIXES (Dec 12, 2025)

*The following critical issues have been resolved in the latest sprint.*

### 🔌 Wallet Connection Improvements
**Files:** `src/hooks/useWallets.tsx`
*   **Redirection Loop Fixed:** Resolved the issue where users were redirected to the extension download page even when the Freighter wallet was already installed.
*   **First-Click Connection:** Wallet now connects successfully on the very first click. Previously, a full application reload was required to recognize the wallet.

### 🔑 Passkey & Transaction Signing
**Files:** `src/services/contract.ts`, `src/lib/passkey.ts`
*   **Passkey Trustline Support:**
    *   **Problem:** Trustline creation failed with "Unsupported wallet connector" for Passkey users.
    *   **Fix:** Added specific Passkey wallet detection and signing support within the trustline creation flow.
*   **Network Passphrase Handling:**
    *   **Problem:** `handleSign` was ignoring the network passphrase, defaulting to TESTNET, which caused signing errors on other networks.
    *   **Fix:** Updated to use `opts?.networkPassphrase || STELLAR_NETWORK` to ensure transactions are parsed and signed for the correct network.
*   **Enhanced Error Handling:**
    *   **Problem:** `signTransaction` returned inconsistent formats, causing parsing errors.
    *   **Fix:** Added handling for multiple return formats: `string`, `signedTxXdr`, `xdr`, and `signedXdr`.

### 🔄 Data Conversion & Serialization
**Files:** `src/utils/convert.ts`
*   **"Bad Union Switch" Error:**
    *   **Problem:** Direct SDK XDR parsing failed when converting ScVal to numbers, causing balance fetches to fail.
    *   **Fix:** Rewrote `scValToNumber` to always serialize to XDR and leverage the backend API for conversion, bypassing client-side SDK parsing limitations.
*   **Enhanced ScVal Serialization:**
    *   **Problem:** `serializeScValForJSON` missed certain ScVal formats.
    *   **Fix:** Added fallback handling for diverse XDR formats and improved error messaging.

### ⛓️ Trustline Logic Optimization
**Files:** `src/services/contract.ts`
*   **Flow Optimization:**
    *   **Problem:** Trustlines were checked before balances, causing unnecessary API calls to Horizon.
    *   **Fix:** Refactored flow to attempt balance fetch first, catch specific trustline errors, and only then attempt creation.
*   **Missing Variable Restoration:**
    *   **Fix:** Restored the `networkPassphrase` variable from `activeChain`, which was missing but required for trustline creation operations.

---

## 🚨 Critical System Failures

### 1. React Hooks & Systemic Crashes
**Severity:** 🔴 CRITICAL  
**Module:** Frontend (Hooks), Backend (API)  
**Status:** ⚠️ PARTIALLY RESOLVED / IN PROGRESS

*   **Status Update:** Significant progress has been made in stabilizing the frontend hooks. The "Nested button hydration warning" has been fixed.
*   **Infinite Retry Loops:** The application still requires fail-safe checks to prevent infinite retry loops when backend requests fail.
*   **3D Canvas Performance:** The interactive 3D background on the home screen remains a source of instability (excessive resource usage) and requires optimization.

### 2. Supabase Edge Function Stability
**Severity:** 🔴 CRITICAL  
**Module:** Backend (Supabase)  
**Status:** ❌ BROKEN

*   **Status Update:** Backend functions (`auth`, `rewards`) are still returning 546/500 errors.
*   **Root Cause:** The functions are likely crashing or timing out ("CPU time limit reached") because the local Supabase Edge Runtime is not running or the functions are still using the incorrect `Deno.serve` architecture.

---

## 🔐 Security & Authentication

### 3. Passkey Implementation Security Flaws
**Severity:** 🔴 CRITICAL (SECURITY RISK)  
**Module:** Authentication (`src/lib/passkey.ts`)  
**Status:** 🚧 30% IMPLEMENTED / INSECURE

The current Passkey implementation is a functional prototype but is fundamentally insecure:
*   **Insecure Storage:** The user's Stellar **secret key** is generated on the client and stored in the browser's `localStorage`.
*   **Missing Backend Logic:** The secure, server-side signing architecture is missing.

---

## 💸 Blockchain & Token Integration Status

### 4. Smart Contract Integration
**Severity:** 🔴 BLOCKER  
**Module:** Blockchain / Integration  
**Status:** ⚠️ INTEGRATION IN PROGRESS

*   **Status Update:** The **Classic Asset (ZIG)** and **Classic Asset Wrapper** contract are **now being used** for critical features (sending, balances).
*   **Airdrop Contract:** The dedicated Airdrop contract has been deployed to Testnet but remains pending full integration with the application logic.
*   **Flow Testing:** Rigorous testing is still required to verify the end-to-end flow now that the contracts are partially active.

### 5. Airdrop & Rewards System
**Severity:** 🔴 BLOCKER  
**Module:** Backend/Blockchain  
**Status:** ❌ BROKEN

*   **Backend Inconsistency:** Game scores are being saved to Supabase, but backend communication is inconsistent.
*   **Reward Distribution:** The logic to save or send rewards (Airdropping) is currently non-functional. It is blocked pending the full integration of the newly deployed Airdrop Contract.

---

## 📝 Next Steps

**Immediate Priorities:**
1.  **Integrate Airdrop Contract:** Connect the backend reward logic to the newly deployed Airdrop contract.
2.  **Refactor Backend:** Rewrite Supabase functions to fix the `Deno.serve` timeout issue.
3.  **Secure Passkeys:** Re-architect the authentication flow to remove secret keys from `localStorage`.
4.  **End-to-End Testing:** Begin rigorous testing of the Airdrop flows with the integrated contracts.