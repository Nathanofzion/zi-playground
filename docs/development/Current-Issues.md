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



=============================================================




### Proposed Solution


Perfect! Let's use **Option 2** to analyze the Kale site repository and resolve your remaining issues. Here's the step-by-step approach:

## **Step 1: Create Analysis Branch & Clone Kale Repo**

````bash
# Navigate to your zi-playground project
cd /Users/nathanieldenny/Desktop/zi-airdrop/zi-playground

# Create analysis branch
git checkout -b analyze-kale-passkey-implementation

# Create temporary analysis directory
mkdir temp-kale-analysis
cd temp-kale-analysis

# Clone the Kale repo
git clone https://github.com/Nathanofzion/kale-site.git .

# Analyze the passkey implementation
echo "🔍 Analyzing Kale's passkey implementation..."
````

## **Step 2: Scan Kale's Codebase Structure**

````bash
# Find passkey-related files
find . -name "*passkey*" -type f
find . -name "*transaction*" -type f  
find . -name "*sign*" -type f
find . -name "*stellar*" -type f

# Check their package.json for dependencies
cat package.json | grep -i passkey
cat package.json | grep -i stellar
cat package.json | grep -i soroban

# Look at their src structure
tree src/ -I node_modules
````

## **Step 3: Identify Key Files to Extract**

Based on what we need to fix, let's look for:

````bash
# Transaction signing implementation
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "signTransaction\|sign.*transaction" 2>/dev/null

# Passkey transaction handlers
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "passkey.*transaction\|transaction.*passkey" 2>/dev/null

# Stellar integration patterns
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "stellar.*sdk\|soroban" 2>/dev/null

# XDR handling
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "xdr\|scVal" 2>/dev/null
````

## **Step 4: Extract and Analyze Core Implementation**

Let's examine their key files:

````bash
# Check their passkey client implementation
ls -la src/lib/*passkey* 2>/dev/null || echo "No passkey files found in src/lib"
ls -la src/components/*passkey* 2>/dev/null || echo "No passkey components found"

# Look for transaction handling
ls -la src/lib/*transaction* 2>/dev/null
ls -la src/lib/*stellar* 2>/dev/null
ls -la src/lib/*contract* 2>/dev/null

# Check their wallet integration
ls -la src/lib/*wallet* 2>/dev/null
````

## **Step 5: Create Integration Plan**

Once we analyze their code, we'll create these files in your project:

````typescript
// Files we'll create/update based on Kale's implementation:

// 1. Enhanced transaction signing
// filepath: src/lib/passkey/transaction-signer.ts
// (Extracted from Kale's implementation)

// 2. Fixed XDR handling  
// filepath: src/lib/stellar/xdr-utils.ts
// (Their XDR conversion patterns)

// 3. Complete passkey-stellar integration
// filepath: src/lib/passkey/stellar-integration.ts
// (Their passkey + Stellar SDK integration)

// 4. Transaction completion handlers
// filepath: src/lib/contracts/transaction-handler.ts
// (Their contract interaction patterns)
````

## **Step 6: Execute the Analysis**

Run this complete analysis script:

````bash
#!/bin/bash
# filepath: analyze-kale.sh

echo "🚀 Starting Kale Repository Analysis..."

# Navigate to zi-playground
cd /Users/nathanieldenny/Desktop/zi-airdrop/zi-playground

# Create analysis branch
git checkout -b analyze-kale-passkey-implementation 2>/dev/null || git checkout analyze-kale-passkey-implementation

# Create temp directory
mkdir -p temp-kale-analysis
cd temp-kale-analysis

# Clone Kale repo
echo "📥 Cloning Kale repository..."
git clone https://github.com/Nathanofzion/kale-site.git . --depth 1

echo "🔍 Analyzing file structure..."

# Key directories to examine
echo "📁 Source structure:"
ls -la src/ 2>/dev/null || echo "No src directory found"

echo "📋 Passkey-related files:"
find . -path "*/node_modules" -prune -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l -i "passkey\|webauthn" {} \; 2>/dev/null

echo "💼 Transaction-related files:"
find . -path "*/node_modules" -prune -o -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "signTransaction\|submitTransaction" {} \; 2>/dev/null

echo "🌟 Stellar SDK integration:"
find . -path "*/node_modules" -prune -o -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "@stellar/stellar-sdk\|soroban" {} \; 2>/dev/null

echo "🔧 XDR handling patterns:"
find . -path "*/node_modules" -prune -o -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "xdr\|scVal\|nativeToScVal" {} \; 2>/dev/null

echo "✅ Analysis complete. Check the files above for implementation patterns."
````

## **Step 7: Run the Analysis**

````bash
# Make the script executable and run it
chmod +x analyze-kale.sh
./analyze-kale.sh
````

## **Step 8: Integration Strategy**

Based on what we find, we'll:

1. **Extract Transaction Signing Logic**
   - Copy their passkey transaction signing implementation
   - Adapt to your existing `PasskeyClient` class

2. **Fix XDR Conversion Issues** 
   - Use their XDR handling patterns
   - Resolve the "union name undefined" errors

3. **Complete Stellar Integration**
   - Implement proper contract interaction
   - Fix token balance and airdrop status calls

4. **Update Your Status Documentation**
   - Mark transaction signing as ✅ resolved
   - Update current status with completed features

## **Let's Start the Analysis!**

**Run this command now:**

````bash
cd /Users/nathanieldenny/Desktop/zi-airdrop/zi-playground
git checkout -b analyze-kale-passkey-implementation
mkdir temp-kale-analysis && cd temp-kale-analysis
git clone https://github.com/Nathanofzion/kale-site.git .
````

Then share the output of:
````bash
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "passkey\|signTransaction" 2>/dev/null
````

This will show us exactly what files contain the passkey transaction handling we need to extract! 🎯

**Ready to run the analysis and fix those remaining issues?**