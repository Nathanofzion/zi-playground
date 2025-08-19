# Current Issues - Active Development Tasks

> **Purpose:** Track current issues that need to be resolved  
> **Status:** Active development tasks from resolved issues follow-up items  
> **Last Updated:** August 19, 2025

---

## 🚨 Issue #6: React Hooks Order Violation - NEW
**Priority:** 🔴 CRITICAL  
**Status:** 🚧 IN PROGRESS  
**Source:** WalletConnectButton violating Rules of Hooks

### Problem Description
The `WalletConnectButton` component is causing React Hooks order violations, which leads to unpredictable behavior and potential crashes. The hooks are being called conditionally or in different orders between renders.

**Error Details:**
```
Warning: React has detected a change in the order of Hooks called by WalletConnectButton
Previous render            Next render
------------------------------------------------------
1. useState                   useState
2. useContext                 useContext
3. undefined                  useContext
```

### Root Cause
Hooks are being called conditionally or the component is re-rendering with different hook call patterns, likely due to conditional hook usage or early returns before all hooks are called.

### Proposed Solution
**Fix Hook Call Order in WalletConnectButton:**
1. **Ensure all hooks are called in the same order** - No conditional hooks
2. **Move conditional logic after all hook calls** - Use state/effects for conditions
3. **Use consistent hook patterns** - Same hooks called on every render

### Tasks
- [ ] Review `WalletConnectButton.tsx` hook usage
- [ ] Fix any conditional hook calls
- [ ] Ensure consistent hook order across renders
- [ ] Test component with different wallet states
- [ ] Add ESLint rules to prevent future hook violations

### Files to Modify
- `src/components/wallet/WalletConnectButton.tsx` - Fix hook order
- `.eslintrc.js` - Add react-hooks rules if missing

---

## 🚨 Issue #7: Airdrop API Edge Function Failure - NEW
**Priority:** 🔴 CRITICAL  
**Status:** 🚧 IN PROGRESS  
**Source:** /api/airdrop returning 500 Internal Server Error

### Problem Description
The airdrop API endpoint is failing with 500 errors due to Stellar SDK dependency issues in the Edge Runtime environment. The `sodium-native` and `require-addon` packages are causing critical dependency errors.

**Error Details:**
```
Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
- sodium-native@4.3.3
- require-addon@1.1.0
- @stellar/stellar-sdk@12.3.0
```

### Root Cause
The Stellar SDK uses native cryptographic dependencies that don't work in Edge Runtime. These packages try to dynamically require native modules which Edge Runtime cannot resolve.

### Proposed Solution
**Use Vercel Runtime Instead of Edge Runtime:**
```typescript
// CURRENT (BROKEN)
export const runtime = 'edge';

// FIXED
export const runtime = 'nodejs';
// OR remove runtime export entirely (defaults to nodejs)
```

**Alternative: Use Browser-Compatible Stellar SDK:**
```typescript
// Use stellar-sdk/minimal for Edge Runtime
import { StellarSdk } from '@stellar/stellar-sdk/minimal';
```

### Tasks
- [ ] Change airdrop API runtime from 'edge' to 'nodejs'
- [ ] Test airdrop functionality with Node.js runtime
- [ ] Consider using minimal Stellar SDK if Edge Runtime needed
- [ ] Review other API routes for similar issues
- [ ] Update deployment configuration if needed

### Files to Modify
- `src/app/api/airdrop/route.ts` - Change runtime configuration
- Other API routes using Stellar SDK

---

## ✅ Issue #1: PasskeyID Multiple Account Generation - RESOLVED
**Priority:** 🔴 CRITICAL  
**Status:** ✅ RESOLVED  
**Source:** Multiple Stellar accounts created for single WebAuthn passkey

### Problem Description
PasskeyID was creating multiple Stellar accounts for the same WebAuthn credential instead of maintaining one account per device. The validation logic incorrectly flagged real accounts as "mock data" when they contained the letter "X" anywhere in the public key.

### Root Cause
**Faulty Mock Data Detection in `passkeyClient.ts`:**
```typescript
// BROKEN LOGIC (FIXED)
const isRealStellarKey = existingWallet?.publicKey && 
  existingWallet.publicKey.startsWith('G') && 
  existingWallet.publicKey.length === 56 &&
  !existingWallet.publicKey.includes('X'); // 🚫 WRONG - Real keys can contain X
```

### ✅ Solution Implemented
**Fixed Mock Data Detection & Authentication Flow:**
1. **Always require WebAuthn authentication first** - No bypassing biometric prompts
2. **Fixed validation logic** - Only reject all-X mock keys, not real keys containing X
3. **Added account refunding** - Handle testnet reset by refunding existing accounts
4. **Authentication-first flow** - WebAuthn biometric prompt before any account checks

### Files Modified
- ✅ `src/lib/passkeyClient.ts` - Fixed validation and authentication flow
- ✅ Added `refundExistingAccount()` helper function
- ✅ Removed bypass logic that skipped WebAuthn

### Results
- ✅ One WebAuthn passkey = One persistent Stellar account
- ✅ Always requires biometric authentication
- ✅ Automatic account refunding on testnet reset
- ✅ No more multiple account generation

---

## 🚀 Issue #2: Automated Deployment Pipeline
**Priority:** High  
**Status:** 🚧 IN PROGRESS  
**Source:** Follow-up from Issue #7 - Main Branch Remote Synchronization

### Problem Description
Need to set up automated deployment pipeline from main branch to production environment. Currently deployment is manual and requires developer intervention.

### Requirements
- Automated deployment trigger on main branch push
- Environment-specific deployments (staging, production)
- Rollback capabilities for failed deployments
- Deployment status monitoring and notifications

### Proposed Solution
**GitHub Actions Deployment Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Vercel Staging
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel Production
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Tasks
- [ ] Create GitHub Actions workflow file
- [ ] Set up Vercel deployment integration
- [ ] Configure environment secrets and variables
- [ ] Set up staging environment for testing
- [ ] Add deployment notifications (Slack/Discord)
- [ ] Create rollback procedure documentation
- [ ] Test deployment pipeline end-to-end

### Files to Create/Modify
- `.github/workflows/deploy.yml` - Main deployment pipeline
- `.github/workflows/test.yml` - Testing pipeline
- `vercel.json` - Vercel configuration
- `docs/deployment/automated-deployment.md` - Deployment documentation

---

## 🔒 Issue #3: Production Branch Protection Rules
**Priority:** Medium  
**Status:** ❌ NOT STARTED  
**Source:** Follow-up from Issue #7 - Main Branch Remote Synchronization

### Problem Description
Main branch currently allows direct pushes without review, which could lead to unstable code in production. Need branch protection rules to ensure code quality and prevent accidental breaking changes.

### Requirements
- Require pull request reviews before merging to main
- Require status checks to pass (tests, linting)
- Restrict direct pushes to main branch
- Require up-to-date branches before merging
- Allow force pushes only for administrators

### Proposed Solution
**GitHub Branch Protection Settings:**
- ✅ Require pull request reviews (minimum 1 reviewer)
- ✅ Require status checks:
  - Jest unit tests
  - ESLint code quality
  - TypeScript type checking
- ✅ Require branches to be up to date
- ✅ Restrict pushes that create files larger than 100MB
- ✅ Allow force pushes: Administrators only
- ✅ Allow deletions: No one

### Tasks
- [ ] Configure GitHub branch protection rules
- [ ] Set up required status checks
- [ ] Define reviewer requirements (CODEOWNERS file)
- [ ] Create pull request template
- [ ] Document new development workflow
- [ ] Train team on new branching strategy
- [ ] Set up development branch for ongoing work

### Files to Create/Modify
- `.github/CODEOWNERS` - Define code review requirements
- `.github/pull_request_template.md` - PR template
- `docs/development/branching-strategy.md` - New development workflow
- GitHub repository settings - Branch protection configuration

---

## 🔗 Issue #4: API Integration Testing
**Priority:** Medium  
**Status:** ❌ NOT STARTED  
**Source:** Follow-up from Issue #9 - Testing Infrastructure

### Problem Description
Edge Functions (auth, rewards) need comprehensive integration testing to ensure reliable API communication and proper error handling.

### Requirements
- Test all Edge Function endpoints
- Verify CORS handling
- Test authentication and authorization
- Error response testing
- Rate limiting verification
- Database integration testing

### Proposed Solution
**Jest API Integration Tests:**
```typescript
// __tests__/api/auth.test.ts
describe('Auth Edge Function', () => {
  test('should generate registration options', async () => {
    // Test WebAuthn challenge generation
  });
  
  test('should verify passkey registration', async () => {
    // Test complete registration flow
  });
  
  test('should handle CORS properly', async () => {
    // Test CORS headers and preflight requests
  });
});

// __tests__/api/rewards.test.ts
describe('Rewards Edge Function', () => {
  test('should return user rewards', async () => {
    // Test rewards retrieval
  });
  
  test('should handle missing users', async () => {
    // Test error handling
  });
});
```

### Tasks
- [ ] Create Auth Edge Function integration tests
- [ ] Create Rewards Edge Function integration tests
- [ ] Add CORS handling verification
- [ ] Test error responses and status codes
- [ ] Add database integration testing
- [ ] Create mock data utilities for testing
- [ ] Add rate limiting tests
- [ ] Integration with CI/CD pipeline

### Files to Create/Modify
- `__tests__/api/auth.test.ts` - Auth function tests
- `__tests__/api/rewards.test.ts` - Rewards function tests
- `__tests__/utils/api-helpers.ts` - API testing utilities
- `__tests__/utils/mock-data.ts` - Test data generation
- `jest.setup.js` - API testing configuration

---

## 🛠️ Issue #5: Test Utilities and Common Workflows
**Priority:** Low  
**Status:** ❌ NOT STARTED  
**Source:** Follow-up from Issue #9 - Testing Infrastructure

### Problem Description
Need reusable test utilities and helpers for common testing workflows to reduce code duplication and improve test maintainability.

### Requirements
- Common authentication test utilities
- Stellar account testing helpers
- API mocking utilities
- Database seeding for tests
- Performance testing helpers

### Proposed Solution
**Comprehensive Test Utilities:**
```typescript
// __tests__/utils/auth-helpers.ts
export const createMockPasskey = () => {
  // Mock PasskeyID registration for testing
};

export const authenticateUser = async (mockCredentials: any) => {
  // Common authentication flow for tests
};

// __tests__/utils/stellar-helpers.ts
export const createTestAccount = () => {
  // Generate test Stellar account
};

export const mockFriendbotResponse = () => {
  // Mock friendbot funding for tests
};

// __tests__/utils/database-helpers.ts
export const seedTestData = () => {
  // Seed database with test data
};

export const cleanupTestData = () => {
  // Clean up test data after tests
};
```

### Tasks
- [ ] Create authentication testing utilities
- [ ] Add Stellar account testing helpers
- [ ] Create API mocking utilities
- [ ] Add database testing helpers
- [ ] Add performance testing helpers
- [ ] Create test data factories
- [ ] Documentation for test utilities

### Files to Create/Modify
- `__tests__/utils/auth-helpers.ts` - Authentication test utilities
- `__tests__/utils/stellar-helpers.ts` - Stellar testing helpers
- `__tests__/utils/api-helpers.ts` - API testing utilities
- `__tests__/utils/database-helpers.ts` - Database test helpers
- `__tests__/utils/performance-helpers.ts` - Performance testing
- `docs/testing/test-utilities.md` - Test utilities documentation

---

## 📊 Current Issues Summary

### 🔴 Critical (2)
1. **React Hooks Order Violation** - WalletConnectButton causing unstable renders
2. **Airdrop API Edge Function Failure** - 500 errors preventing airdrops

### ✅ Resolved (1)
3. **PasskeyID Multiple Account Generation** - ✅ Fixed authentication flow and account persistence

### 🚧 In Progress (1)
4. **Automated Deployment Pipeline** - CI/CD setup for production deployment

### ❌ Not Started (3)
5. **Production Branch Protection Rules** - Code review and quality gates
6. **API Integration Testing** - Edge Function testing
7. **Test Utilities and Common Workflows** - Testing infrastructure improvements

### 🎯 Priority Order
1. **🔴 CRITICAL:** React Hooks Order Violation (app stability)
2. **🔴 CRITICAL:** Airdrop API Edge Function Failure (core functionality)
3. **HIGH:** Automated Deployment Pipeline (production readiness)
4. **MEDIUM:** Production Branch Protection Rules (code quality)
5. **MEDIUM:** API Integration Testing (backend reliability)
6. **LOW:** Test Utilities and Common Workflows (developer experience)

### 📈 Expected Impact
- ✅ **Account Persistence:** One stable account per device - RESOLVED
- ✅ **User Experience:** Reliable WebAuthn authentication - RESOLVED  
- **App Stability:** Fix React hooks violations to prevent crashes
- **Airdrop Functionality:** Restore working airdrop distribution
- **Deployment Automation:** Faster, more reliable releases
- **Code Quality:** Protected main branch with review process
- **Backend Reliability:** Comprehensive API testing
- **Developer Experience:** Improved testing tools and workflows

### 🚀 Next Steps
1. **🔴 URGENT:** Fix React Hooks order violation in WalletConnectButton
2. **🔴 URGENT:** Fix Airdrop API Edge Function failure  
3. **HIGH:** Complete Automated Deployment Pipeline
4. **MEDIUM:** Implement Branch Protection Rules
5. **MEDIUM:** Add API Integration Testing
6. **LOW:** Enhance testing infrastructure

---

## 🎉 Recent Achievements

### ✅ PasskeyID Multiple Account Generation - RESOLVED
- **Fixed authentication flow** - Always requires WebAuthn biometric prompt
- **Improved account persistence** - One device = One account, with automatic refunding
- **Enhanced validation logic** - Only rejects actual mock keys, not real keys with X
- **Better user experience** - Consistent account across sessions with proper authentication

**Impact:** Users now have a reliable, secure authentication experience with persistent accounts.

---

*Last Updated: August 19, 2025*  
*Status: 6 active issues (2 critical), 1 resolved*  
*Priority: Fix critical React hooks and airdrop API issues immediately*