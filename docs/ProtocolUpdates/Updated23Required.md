# Stellar Protocol 23 Update & Implementation Plan

> **Protocol 23 Upgrade Guide for ZI Playground DApp**  
> **Testnet Live:** July 17, 2025  
> **Mainnet Target:** September 3, 2025  
> **Last Updated:** August 19, 2025

---

## 🚀 Protocol 23 Overview

The Stellar Testnet Protocol 23 upgrade, which went live on July 17, 2025, introduces significant enhancements to the Stellar network, focusing on smart contract capabilities, performance improvements, and developer experience. Below are the key updates in Protocol 23 and the associated changes to Stellar SDKs, based on available information.

---

## 🔧 Key Updates in Stellar Testnet Protocol 23

Protocol 23 introduces eight Core Advancement Proposals (CAPs) to enhance the Stellar network's functionality, particularly for smart contracts via Soroban, scalability, and developer tools. Here's a summary of the key updates:

### 1. Unified Asset Events (CAP-0067)
- Enables Stellar Core to emit events for all asset movements in the Soroban Token Interface (SEP-0041) format, unifying event streams between classic Stellar operations and Soroban smart contracts.
- Removes admin topics from mint, clawback, and set_authorized events, adds fee events, and updates Stellar Asset Contract (SAC) to emit mint/burn events instead of transfer events when the issuer is involved.
- Supports multiplexed accounts (M-accounts) for exchange crypto-deposits and prohibits transaction memos for Soroban transfers.
- Infrastructure providers (e.g., indexers) may need to reingest historical data to support full event backfilling from the genesis ledger.

### 2. Soroban Live State Prioritization (CAP-0062)
- Separates live and archived state into two databases: "Live State" BucketList (containing all live ledger entries) and "Hot Archive" BucketList (for archived Soroban entries).
- Improves performance by prioritizing live state, reducing disk access, and setting the stage for full state archival (CAP-0057, in draft).

### 3. Parallel Transaction Execution (CAP-0063)
- Introduces a new transaction set structure for parallel execution of Soroban smart contract transactions, leveraging multiple CPU cores to improve speed and efficiency.
- Adjusts TTL extension and fee refund logic for better resource management.

### 4. Reusable Wasm Module Cache (CAP-0065)
- Implements a persistent cache for WebAssembly (Wasm) modules, keeping them parsed, validated, and translated in memory across ledgers.
- Reduces costs for cross-contract calls by eliminating repetitive parsing/validation/translation, with fees tied to contract upload or restore actions.

### 5. In-Memory Soroban State (CAP-0066)
- Moves all live Soroban state to validator memory, eliminating disk reads during contract execution, which boosts throughput and reduces fees.
- Introduces automatic restoration of archived entries via InvokeHostFunctionOp, removing the need for manual restoration.
- Adds a new resource type for in-memory vs. disk reads, with no read byte limits or fees for live Soroban state (though entry limits apply).

### 6. New Soroban Host Functions
**CAP-0068:** Adds a host function to retrieve the executable (Wasm or built-in) associated with a contract address, enabling use cases like distinguishing SAC instances, enforcing authorization policies, and pinning contract dependencies.

**CAP-0069:** Introduces host functions for converting between strings and bytes (bytes_to_string, string_to_bytes), simplifying contract development and reducing complexity.

### 7. Configurable SCP Timing Parameters (CAP-0070)
- Adds ledger configuration settings to dynamically adjust Stellar Consensus Protocol (SCP) timings, such as ledger close times and nomination/ballot timeouts.
- Enables incremental improvements to block time performance, enhancing scalability and resilience without major protocol upgrades.

### 8. Transaction Meta Structure Update
- Introduces TransactionMetaV4, replacing TransactionMetaV3, with a new postTxApplyFeeProcessing field to represent fee processing after transaction application.
- Affects applications reading raw transaction metadata from Stellar Core, Horizon, Stellar RPC, or Galexie (e.g., dapps, indexers, exchanges, wallets).

---

## 🔄 Testnet Reset and Breaking Changes

### August 14, 2025 Reset Impact
- A Testnet reset occurred on August 14, 2025, clearing all ledger entries (accounts, assets, contracts), requiring developers to recreate data.
- Older versions of Stellar Core, Horizon, RPC, and SDKs are incompatible post-reset, necessitating upgrades to stable releases.
- Stellar RPC rebranded from Soroban RPC, with soroban-rpc packages discontinued.

---

## 📚 Key Updates in Stellar SDKs for Protocol 23

The Protocol 23 upgrade requires updates to Stellar SDKs to ensure compatibility with the new features and breaking changes. Below are the key SDK updates and considerations:

### General SDK Upgrade Requirement
- All Stellar SDKs (Rust, JavaScript, Go, Java, Python, iOS, PHP, C# .NET, Flutter, Elixir) must be updated to their latest versions by August 14, 2025, for Testnet compatibility and by September 3, 2025, for Mainnet.
- Check release notes for specific instructions, as SDKs must support the new TransactionMetaV4 structure and updated APIs.

### Specific SDK Versions for Testnet (Protocol 23)
- **Rust SDK:** Version 23.0.0-rc.2.2 (soroban-sdk:23.0.0-rc.2.1).
- **JavaScript Base:** Version 14.0.0-rc.2 (NPM: 14.0.0-rc.2).
- **JavaScript SDK:** Version 14.0.0-rc.3 (NPM: 14.0.0-rc.3).
- Other SDKs (e.g., Java, Python, Go) have Protocol 23-compatible releases, with links provided in the Protocol 23 Upgrade Guide.

### Breaking Changes in SDKs
- **horizonclient:** Removed fields from the Horizon API, including errorResultXdr, num_archived_contracts, and archived_contracts_amount from the /assets response, requiring SDK updates to handle these changes.
- **js-stellar-sdk:** Now requires Node.js version 20 or higher for compatibility.
- SDKs must handle the new TransactionMetaV4 structure and updated event formats from CAP-0067, impacting how applications parse transaction metadata.

### Stellar CLI Updates
- The Soroban CLI has been renamed to Stellar CLI (version 23.0.0).
- Key changes include:
  - Support for contract ID alias names during deployment/invocation.
  - New cache subcommands and transaction data logging.
  - Updated TypeScript bindings to stellar-sdk 12rc2.
  - Removal of deprecated commands (lab token, lab xdr, config).
  - Enhanced ledger signing and container log tailing.

---

## 🎯 ZI Playground Implementation Plan

### 🚧 Current Status - Required Updates

#### 1. SDK Compatibility Updates
**Priority:** 🔴 CRITICAL  
**Status:** ❌ NOT STARTED  
**Deadline:** September 3, 2025 (Mainnet)

- [ ] **Update @stellar/stellar-sdk** to Protocol 23 compatible version (14.0.0+)
- [ ] **Update @stellar/stellar-base** to compatible version
- [ ] **Verify Node.js version 20+** requirement compliance
- [ ] **Test SDK compatibility** with current DApp functionality
- [ ] **Update import statements** for new SDK structure

```typescript
// Current version check needed
// package.json updates required:
"@stellar/stellar-sdk": "^14.0.0", // Update from current version
"@stellar/stellar-base": "^12.1.1", // Verify compatibility
```

#### 2. Transaction Signing Implementation
**Priority:** 🔴 CRITICAL  
**Status:** 🔄 PLACEHOLDER IMPLEMENTATION  
**Issue:** Currently returns unsigned XDR (needs Stellar SDK integration)

**Current Implementation (Incomplete):**
```typescript
// src/lib/passkey.ts - NEEDS PROTOCOL 23 UPDATES
export const handleSign = async (xdr: string, opts?: any) => {
  console.log('🚧 Placeholder: Transaction signing not yet implemented');
  console.log('📄 XDR to sign:', xdr);
  
  // ❌ PLACEHOLDER - NEEDS REAL IMPLEMENTATION
  return xdr; // Returns unsigned XDR - NOT FUNCTIONAL
};
```

**Required Protocol 23 Implementation:**
```typescript
// src/lib/passkey.ts - PROTOCOL 23 COMPLIANT
import { 
  Transaction, 
  Networks, 
  TransactionBuilder,
  Keypair 
} from '@stellar/stellar-sdk';

export const handleSign = async (xdr: string, opts?: {
  network?: string;
  networkPassphrase?: string;
  accountToSign?: string;
}) => {
  try {
    console.log('🔐 Signing transaction with Protocol 23 SDK...');
    
    // Get locally stored secret key (DeFi compliant)
    const credentialId = LocalKeyStorage.getCurrentCredentialId();
    const passkeyData = LocalKeyStorage.getPasskeyData(credentialId);
    
    if (!passkeyData?.secretKey) {
      throw new Error('No secret key found for transaction signing');
    }
    
    // Parse transaction with Protocol 23 SDK
    const transaction = new Transaction(xdr, opts?.networkPassphrase || Networks.TESTNET);
    
    // Sign with local secret key
    const keypair = Keypair.fromSecret(passkeyData.secretKey);
    transaction.sign(keypair);
    
    console.log('✅ Transaction signed successfully with Protocol 23');
    return transaction.toXDR();
    
  } catch (error) {
    console.error('❌ Protocol 23 transaction signing failed:', error);
    throw error;
  }
};
```

**Tasks:**
- [ ] Implement real transaction signing with Protocol 23 SDK
- [ ] Update transaction building for TransactionMetaV4
- [ ] Test signing with new SDK version
- [ ] Verify compatibility with Stellar RPC (renamed from Soroban RPC)
- [ ] Update error handling for new SDK structure

#### 3. API Integration Updates
**Priority:** 🟡 HIGH  
**Status:** ❌ NOT STARTED  

**Required Changes:**
- [ ] **Update Stellar RPC endpoints** (renamed from Soroban RPC)
- [ ] **Handle TransactionMetaV4** structure in transaction parsing
- [ ] **Update event handling** for unified asset events (CAP-0067)
- [ ] **Test Horizon API changes** (removed fields)

```typescript
// src/lib/stellar.ts - PROTOCOL 23 UPDATES NEEDED
import { Horizon, StellarRpc } from '@stellar/stellar-sdk'; // Updated imports

// Update RPC client for Protocol 23
const rpcServer = new StellarRpc.Server('https://soroban-testnet.stellar.org'); // Update URL
// const rpcServer = new StellarRpc.Server('https://stellar-rpc-testnet.stellar.org'); // New URL?

// Handle TransactionMetaV4
const parseTransactionMeta = (meta: any) => {
  if (meta.v === 4) { // TransactionMetaV4
    // Handle new postTxApplyFeeProcessing field
    const feeProcessing = meta.postTxApplyFeeProcessing;
    // Update parsing logic
  }
};
```

#### 4. Testing Infrastructure Updates
**Priority:** 🟡 HIGH  
**Status:** 🔄 PLANNED  

- [ ] **Add comprehensive authentication flow tests**
  ```typescript
  // __tests__/auth/passkey-protocol23.test.ts
  describe('PasskeyID Protocol 23 Authentication', () => {
    test('should handle Protocol 23 transaction signing', async () => {
      // Test with new SDK version
      const signedXdr = await handleSign(mockXdr, {
        networkPassphrase: Networks.TESTNET
      });
      expect(signedXdr).toContain('signatures');
    });
    
    test('should verify TransactionMetaV4 parsing', async () => {
      // Test new transaction meta structure
    });
  });
  ```

- [ ] **Add API integration tests for Edge Functions**
  ```typescript
  // __tests__/api/protocol23-integration.test.ts
  describe('Protocol 23 API Integration', () => {
    test('should handle Stellar RPC renamed endpoints', async () => {
      // Test new RPC server endpoints
    });
    
    test('should parse unified asset events', async () => {
      // Test CAP-0067 event format
    });
  });
  ```

- [ ] **Set up CI/CD pipeline with automated testing**
  ```yaml
  # .github/workflows/protocol23-testing.yml
  name: Protocol 23 Testing
  on: [push, pull_request]
  jobs:
    test-protocol23:
      runs-on: ubuntu-latest
      steps:
        - name: Setup Node.js 20+
          uses: actions/setup-node@v4
          with:
            node-version: '20'
        - name: Install Protocol 23 SDKs
          run: |
            pnpm add @stellar/stellar-sdk@^14.0.0
            pnpm add @stellar/stellar-base@^12.1.1
        - name: Run Protocol 23 tests
          run: pnpm test:protocol23
  ```

- [ ] **Add visual regression testing**
  ```typescript
  // tests/visual/protocol23-ui.spec.ts
  test.describe('Protocol 23 UI Changes', () => {
    test('should display Protocol 23 transaction details correctly', async ({ page }) => {
      // Test UI with new transaction meta format
      await expect(page.locator('.transaction-meta')).toHaveScreenshot('protocol23-transaction.png');
    });
  });
  ```

- [ ] **Create test utilities for common workflows**
  ```typescript
  // __tests__/utils/protocol23-helpers.ts
  export const createProtocol23Transaction = (opts: any) => {
    // Helper for creating P23 compatible transactions
  };
  
  export const mockTransactionMetaV4 = () => {
    // Mock new transaction meta format
  };
  
  export const setupProtocol23TestEnv = () => {
    // Setup test environment with P23 SDKs
  };
  ```

---

## 📅 Implementation Timeline

### Phase 1: Critical Updates (Deadline: September 3, 2025)
**Week 1 (Aug 19-25):**
- [ ] Update Stellar SDK to Protocol 23 version
- [ ] Implement real transaction signing
- [ ] Basic compatibility testing

**Week 2 (Aug 26-Sep 1):**
- [ ] Update API integrations for Stellar RPC
- [ ] Handle TransactionMetaV4 structure
- [ ] Comprehensive testing

**Week 3 (Sep 2-3):**
- [ ] Final testing and deployment
- [ ] Mainnet readiness verification

### Phase 2: Enhanced Testing (Post-Mainnet)
**Week 4 (Sep 4-10):**
- [ ] Complete E2E test suite
- [ ] Visual regression testing
- [ ] CI/CD pipeline enhancement

---

## 🔍 Testing Checklist for Protocol 23

### ✅ SDK Compatibility
- [ ] Verify @stellar/stellar-sdk 14.0.0+ installation
- [ ] Test Node.js 20+ compatibility
- [ ] Validate import statement updates
- [ ] Check breaking changes in SDK APIs

### ✅ Transaction Signing
- [ ] Real transaction signing implementation
- [ ] TransactionMetaV4 structure handling
- [ ] Local secret key integration (DeFi compliant)
- [ ] Error handling for new SDK structure

### ✅ API Integration
- [ ] Stellar RPC endpoint updates
- [ ] Horizon API field removals handling
- [ ] Unified asset events parsing (CAP-0067)
- [ ] Event stream compatibility

### ✅ DApp Functionality
- [ ] PasskeyID authentication flow
- [ ] Account generation with Protocol 23
- [ ] Balance queries with updated APIs
- [ ] Transaction submission and confirmation

### ✅ Performance & Features
- [ ] In-memory state benefits (CAP-0066)
- [ ] Parallel execution compatibility (CAP-0063)
- [ ] New host functions availability (CAP-0068, CAP-0069)

---

## 🚨 Breaking Changes Impact on ZI Playground

### High Impact Changes
1. **Transaction Signing** - Currently non-functional placeholder
2. **SDK Version Requirements** - Node.js 20+ requirement
3. **API Endpoints** - Stellar RPC rebranding from Soroban RPC
4. **Transaction Meta** - TransactionMetaV4 structure changes

### Medium Impact Changes
1. **Event Handling** - Unified asset events format
2. **Import Statements** - SDK structure updates
3. **Error Handling** - New SDK error formats

### Low Impact Changes
1. **Performance Improvements** - Automatic benefits from P23 optimizations
2. **New Host Functions** - Optional features for future development

---

## 📋 Developer Considerations

### Mandatory Actions
- [ ] **Upgrade SDKs** to Protocol 23 compatible versions by September 3, 2025
- [ ] **Implement transaction signing** - Replace placeholder with real functionality
- [ ] **Update API calls** for Stellar RPC rebranding
- [ ] **Test thoroughly** on Testnet before Mainnet upgrade

### Recommended Actions
- [ ] **Enhanced testing suite** for Protocol 23 features
- [ ] **Performance monitoring** to verify P23 benefits
- [ ] **Event handling updates** for unified asset events
- [ ] **Documentation updates** for new SDK structure

### Optional Enhancements
- [ ] **Leverage new host functions** for advanced contract features
- [ ] **Optimize for parallel execution** benefits
- [ ] **Implement visual regression testing** for UI consistency

---

## 📚 Resources for Protocol 23 Migration

### Official Documentation
- [Protocol 23 Upgrade Guide](https://stellar.org/developers/docs/releases/protocol-23) - Detailed migration instructions
- [Stellar Developer Discord](https://discord.gg/stellardev) - Real-time updates and community support
- [GitHub CAP Repository](https://github.com/stellar/stellar-protocol) - Technical specifications

### SDK Resources
- [JavaScript SDK 14.0.0+ Release Notes](https://github.com/stellar/js-stellar-sdk/releases)
- [Stellar Base 12.1.1+ Documentation](https://stellar.github.io/js-stellar-base/)
- [Migration Examples](https://github.com/stellar/stellar-docs/tree/main/examples/protocol-23)

### Testing Resources
- [Protocol 23 Test Networks](https://stellar.org/developers/reference/networks)
- [Stellar CLI 23.0.0](https://github.com/stellar/stellar-cli) - Updated tooling
- [XDR Changes Documentation](https://github.com/stellar/stellar-xdr/releases)

---

## ✅ Current Implementation Status

### ❌ Not Protocol 23 Ready
- **Transaction Signing** - Placeholder implementation only
- **SDK Versions** - Need updates to 14.0.0+
- **API Integration** - Uses old endpoint names
- **Testing Suite** - Missing P23 specific tests

### 🔄 Partial Implementation
- **DeFi Architecture** - Compatible with P23 (local key storage)
- **Basic Authentication** - Works but needs SDK updates
- **Account Generation** - Functional but needs P23 optimizations

### ✅ Protocol 23 Compatible
- **Non-Custodial Design** - Aligns with P23 performance improvements
- **Local Storage** - Ready for enhanced throughput
- **WebAuthn Integration** - Compatible with updated SDKs

---

**Next Immediate Action:** Update @stellar/stellar-sdk to 14.0.0+ and implement real transaction signing to replace placeholder functionality.

**Critical Deadline:** September 3, 2025 - Mainnet Protocol 23 upgrade

**Status:** 🚨 **URGENT** - Major updates required for Protocol 23 compatibility

---

*Last Updated: August 19, 2025*  
*Protocol Version: 23 (Testnet: Live, Mainnet: September 3, 2025)*  
*DApp Status: Requires critical updates for compatibility*