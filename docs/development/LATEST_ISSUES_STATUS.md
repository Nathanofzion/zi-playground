# Latest Issues Status Report

> **Status:** Active Investigation & Integration Phase  
> **Last Updated:** November 19, 2025  
> **Context:** This document outlines the critical issues, integration gaps, and architectural flaws identified during the latest round of comprehensive testing for the `zi-playground` application.

---

## 🚨 Critical System Failures

### 1. React Hooks & Systemic Crashes
**Severity:** 🔴 CRITICAL  
**Module:** Frontend (Hooks), Backend (API)  
**Status:** ❌ BROKEN

The reported "Hooks Crash" is not an isolated frontend bug but a symptom of multiple systemic failures:
*   **Root Cause:** Hooks are failing because they are dependent on backend services and database structures that are either missing, broken, or incomplete. The frontend attempts to fetch data that doesn't exist, causing unhandled exceptions.
*   **Rendering Issues:** Basic rendering optimizations are missing. Conditional rendering logic is flawed, leading to crashes when data is missing instead of failing gracefully.
*   **Infinite Retry Loops:** When a request fails (e.g., due to the broken backend), the application attempts to retry infinitely without any fail-safe checks. This floods the network and contributes to the CPU overload described below.

### 2. 3D Canvas Performance & Crash
**Severity:** 🔴 CRITICAL  
**Module:** Frontend (UI/UX)  
**Status:** ⚠️ UNSTABLE

The interactive 3D background on the home screen is a major source of instability:
*   **Resource Leak:** Clicking on the canvas spawns new 3D polygon instances without limit.
*   **Impact:** This causes rapid and excessive CPU and memory consumption, directly leading to browser freezes and application crashes.
*   **Recommendation:** Implement object pooling, limit the maximum number of particles, and optimize the WebGL rendering context.

### 3. Supabase Edge Function Timeouts
**Severity:** 🔴 CRITICAL  
**Module:** Backend (Supabase)  
**Status:** ❌ BROKEN

Backend functions are consistently failing with "CPU time limit reached" errors:
*   **Root Cause:** The functions (`auth`, `rewards`, etc.) are incorrectly using `Deno.serve`, which starts a persistent web server inside a serverless environment.
*   **Infinite Requests:** The frontend's lack of fail-safes (mentioned in Issue #1) exacerbates this by bombarding these struggling functions with infinite requests.
*   **Result:** The serverless functions time out and are forcibly terminated by the supervisor.

---

## 🔐 Security & Authentication

### 4. Passkey Implementation Security Flaws
**Severity:** 🔴 CRITICAL (SECURITY RISK)  
**Module:** Authentication (`src/lib/passkey.ts`)  
**Status:** 🚧 30% IMPLEMENTED / INSECURE

The current Passkey implementation is a functional prototype but is fundamentally insecure:
*   **Insecure Storage:** The user's Stellar **secret key** is generated on the client and stored in the browser's `localStorage`. This exposes the user to total fund theft via XSS attacks.
*   **Missing Backend Logic:** The secure, server-side signing architecture (decrypting keys only in memory) is missing.
*   **Database Gap:** Keys are not being securely encrypted and stored in the database, preventing cross-device usage or account recovery.

---

## 💸 Blockchain & Token Integration Status

### 5. Smart Contract Integration & Testing
**Severity:** 🔴 BLOCKER  
**Module:** Blockchain / Integration  
**Status:** ⚠️ DEPLOYED BUT PENDING INTEGRATION

*   **Status Update:** The **Airdrop Contract**, **Classic Asset (ZIG)**, and **Classic Asset Wrapper** have been successfully developed and deployed to the Stellar Testnet as standalone components.
*   **Integration Gap:** These contracts are **newly deployed** and have not yet been integrated into the `zi-playground` application code.
*   **Required Actions:**
    *   Update environment variables with the new contract addresses.
    *   Refactor frontend hooks (`useAirdrop`, `useSwap`, etc.) to communicate with these live contracts.
    *   **Flow Testing:** Rigorous testing is required to verify the end-to-end flow (Frontend -> API -> Smart Contract) now that the contracts exist. We anticipate potential issues with XDR encoding, trustline verification, and data type conversions surfacing during this phase.

### 6. Send/Receive & Data Conversion
**Severity:** 🟠 HIGH  
**Module:** Frontend/Blockchain  
**Status:** ⚠️ BUGGY

*   **Data Type Issues:** Significant issues found in converting between native JavaScript types and Stellar XDR/ScVal formats.
*   **Missing References:** Some functions referenced in the code for token fetching and validation do not exist or are imported incorrectly.
*   **QR Code Failure:** The QR code scanner works but directs users to a random or incorrect wallet address, failing to generate a meaningful unsigned transaction or payment request.

### 7. Airdrop & Rewards System
**Severity:** 🔴 BLOCKER  
**Module:** Backend/Blockchain  
**Status:** ❌ BROKEN

*   **Backend Inconsistency:** Game scores are being saved to Supabase, but backend communication is inconsistent and requires debugging.
*   **Reward Distribution:** The logic to save or send rewards (Airdropping) is currently non-functional. It is blocked pending the full integration and flow testing of the newly deployed Airdrop Contract.
*   **Blocked Features:** We are currently unable to proceed with testing Soroswap integration, Sending, Receiving, and Liquidity provision until the foundational Airdrop and Token flows are stabilized.

---

## 📝 Summary & Next Steps

The project has reached a critical milestone with the deployment of the necessary smart contracts. The focus now shifts from "development" to "integration and stabilization."

**Immediate Priorities:**
1.  **Integrate Contracts:** Connect the frontend and backend to the newly deployed Testnet contracts.
2.  **Refactor Backend:** Rewrite Supabase functions to fix the `Deno.serve` timeout issue.
3.  **Secure Passkeys:** Re-architect the authentication flow to remove secret keys from `localStorage`.
4.  **Stabilize Frontend:** Implement error handling to stop infinite loops and fix the 3D canvas performance issues.
5.  **End-to-End Testing:** Begin rigorous testing of the Airdrop and Token flows to identify and fix hidden conversion or logic bugs.