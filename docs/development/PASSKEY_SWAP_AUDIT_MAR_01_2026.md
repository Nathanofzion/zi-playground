# PasskeyID Swap Issues Audit - March 1, 2026

**Branch**: `soroswap-integration`  
**Audit Date**: March 1, 2026  
**Status**: 🚨 **MULTIPLE CRITICAL ISSUES BLOCKING SWAP FUNCTIONALITY**

---

## 📊 **Executive Summary**

PasskeyID wallet integration has **3 CRITICAL ISSUES** preventing swap transactions from completing. While authentication and wallet connectivity work correctly, swap execution fails at multiple points in the transaction pipeline.

### **Status Overview**
| Component | Status | Evidence |
|-----------|--------|----------|
| **Wallet Connection** | ✅ WORKING | PasskeyID connects successfully |
| **Authentication** | ✅ WORKING | WebAuthn prompts confirmed by user |
| **Balance Queries** | ✅ WORKING | Asset balances load correctly |
| **Contract Simulation** | ✅ WORKING | Simulations succeed |
| **Amount Calculation** | ❌ **BROKEN** | BigInt conversion from NaN |
| **Transaction Submission** | ❌ **BROKEN** | CORS policy blocking |
| **Swap Functionality** | ❌ **COMPLETELY BLOCKED** | Multiple failure points |

---

## 🚨 **CRITICAL ISSUE #1: BigInt Conversion Error**

### **Problem**: Invalid Amount Calculation
**Severity**: CRITICAL  
**Impact**: Prevents swap amount calculation  

**Error Evidence**:
```javascript
Swap error: TypeError: expected bigint-like values, got: NaN (SyntaxError: Cannot convert NaN to a BigInt)
    at eval (stellar-sdk.min.js:3:6080)
    at i128FromDecimal (useSwap.tsx:54:34)
    at swap (useSwap.tsx:88:9)
```

### **Root Cause Analysis**:
The `i128FromDecimal` function in [useSwap.tsx:54](src/hooks/useSwap.tsx#L54) is receiving `NaN` instead of a valid number, causing `BigInt` conversion to fail.

**Code Location**: [src/hooks/useSwap.tsx:54](src/hooks/useSwap.tsx#L54)
```typescript
// This is failing with NaN input
return StellarSdk.xdr.ScVal.scvI128(
  new StellarSdk.xdr.Int128Parts({
    hi: StellarSdk.xdr.Int64.fromString(hi.toFixed(0)), // ← NaN causes failure
    lo: StellarSdk.xdr.Uint64.fromString(lo.toFixed(0)), // ← NaN causes failure
  })
);
```

**Impact**: **ALL swap calculations fail before reaching transaction submission**

---

## 🚨 **CRITICAL ISSUE #2: OpenZeppelin Relayer CORS Policy**

### **Problem**: Custom Headers Rejected by CORS
**Severity**: CRITICAL  
**Impact**: All PasskeyID transaction submissions blocked  

**Error Evidence**:
```javascript
Access to fetch at 'https://channels.openzeppelin.com/testnet' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Request header field x-client-version is not allowed by 
Access-Control-Allow-Headers in preflight response.
```

### **Root Cause Analysis**:
The `passkey-kit` library automatically adds custom headers (`x-client-version`, etc.) that OpenZeppelin Relayer **does not allow** in its CORS policy.

**Code Flow**:
1. ✅ Transaction signing completes successfully
2. ✅ WebAuthn authentication works  
3. ❌ **PasskeyServer.send()** → CORS rejection
4. ❌ **Transaction submission fails**

**Impact**: **NO PasskeyID transactions can be submitted**

---

## 🚨 **CRITICAL ISSUE #3: Transaction Pipeline Failure**

### **Problem**: Multiple Points of Failure
**Severity**: CRITICAL  
**Impact**: Complete swap functionality breakdown  

**Failure Sequence**:
```javascript
1. calculateAmount → BigInt NaN error
2. swap execution → BigInt NaN error  
3. signTransaction → CORS blocking
4. Final result: Complete failure
```

**Impact**: **PasskeyID swaps completely non-functional**

---

## ✅ **WORKING COMPONENTS** 

### **Authentication & Connection**
- ✅ **PasskeyID Wallet Connection**: Works correctly
- ✅ **WebAuthn Authentication**: TouchID/FaceID prompts working
- ✅ **Wallet Storage**: Multi-wallet management functional
- ✅ **Session Management**: Proper reconnection flow

### **Contract Integration**  
- ✅ **Balance Queries**: Asset balances load successfully
- ✅ **Contract Simulation**: All simulations return success
- ✅ **Contract Detection**: Factory contract integration working

**Evidence**:
```javascript
✅ contract-fe.ts:195 Simulation successful: {hasRetval: true, resultType: 'object'}
✅ useAssets.tsx:59 Parsed Balance: 350000000
✅ passkeyClient.ts:331 Found stored passkey session, reconnecting without WebAuthn prompt...
```

---

## 🔧 **REQUIRED DEVELOPER FIXES**

### **IMMEDIATE ACTIONS (Critical Priority)**

#### **Fix #1: BigInt Conversion Issue**
**Location**: [src/hooks/useSwap.tsx:54](src/hooks/useSwap.tsx#L54)

**Problem**: `i128FromDecimal()` receiving NaN values
**Required Action**: 
- Validate input to `i128FromDecimal` function
- Add NaN checking before BigInt conversion
- Trace where NaN values originate in swap calculation

**Sample Fix**:
```typescript
function i128FromDecimal(amount: string): StellarSdk.xdr.ScVal {
  const amountBN = new BigNumber(amount);
  
  // Add validation to prevent NaN
  if (!amountBN.isFinite() || amountBN.isNaN()) {
    throw new Error(`Invalid amount for BigInt conversion: ${amount}`);
  }
  
  // Rest of conversion logic...
}
```

#### **Fix #2: CORS Policy Resolution**  
**Location**: PasskeyServer configuration

**Options for Resolution**:
1. **Option A**: Configure PasskeyServer without custom headers
2. **Option B**: Use direct Soroban RPC submission instead of OpenZeppelin Relayer  
3. **Option C**: Proxy requests through backend API to avoid CORS

**Recommended**: Direct RPC submission for PasskeyID transactions

#### **Fix #3: Transaction Submission Alternative**
**Problem**: OpenZeppelin Relayer incompatible with passkey-kit headers
**Solution**: Bypass OpenZeppelin Relayer for PasskeyID transactions

---

## 🧪 **TESTING REQUIREMENTS**

### **Pre-Fix Testing**
- [ ] Identify exact source of NaN values in swap calculations
- [ ] Verify which headers cause CORS rejection
- [ ] Test alternative transaction submission methods

### **Post-Fix Validation**  
- [ ] **Amount Calculation**: No BigInt conversion errors
- [ ] **Transaction Submission**: No CORS blocking
- [ ] **End-to-End Swaps**: Complete PasskeyID swap functionality
- [ ] **Cross-Browser**: Test on multiple browsers/authenticators

---

## 📋 **DEVELOPMENT WORKFLOW**

### **Phase 1: BigInt Fix (Day 1)**
1. **Debug**: Trace NaN source in amount calculations
2. **Fix**: Add proper number validation
3. **Test**: Verify amount calculations work

### **Phase 2: CORS Resolution (Day 2)**  
1. **Research**: Test alternative transaction submission
2. **Implement**: Direct RPC or backend proxy solution
3. **Test**: Verify transaction submission works

### **Phase 3: Integration Testing (Day 3)**
1. **End-to-End**: Complete swap flow testing
2. **Edge Cases**: Invalid amounts, network errors
3. **Performance**: Transaction speed and reliability

---

## 🎯 **BUSINESS IMPACT**

### **Current State**
- ❌ **PasskeyID Swaps**: Completely non-functional
- ✅ **Freighter Swaps**: Working normally  
- ✅ **PasskeyID Wallets**: Creation and management working
- ✅ **Balance Display**: Asset information accurate

### **User Experience Impact**
- **Major Feature Missing**: PasskeyID users cannot swap tokens
- **Workaround Required**: Users must use Freighter for swaps
- **Security Promise Intact**: Authentication security working correctly

### **Technical Debt**
- **Architecture Issue**: Transaction submission pipeline needs redesign
- **Library Compatibility**: passkey-kit vs OpenZeppelin Relayer conflict
- **Error Handling**: Need better validation and error messages

---

## 📊 **RISK ASSESSMENT**

| Issue | Severity | Impact | Development Time | Risk Level |
|-------|----------|---------|-----------------|------------|
| BigInt NaN Conversion | Critical | High | 4-8 hours | **HIGH** |
| CORS Policy Blocking | Critical | High | 1-2 days | **HIGH** |
| Transaction Pipeline | Critical | High | 2-3 days | **CRITICAL** |

---

## 🚀 **RECOMMENDATIONS**

### **Immediate Actions**
1. **Fix BigInt conversion** - relatively straightforward debugging
2. **Implement CORS workaround** - may require architecture change
3. **Add comprehensive error handling** - improve user experience

### **Long-term Solutions**  
1. **Direct Soroban RPC** for PasskeyID transactions
2. **Backend transaction proxy** to handle CORS issues
3. **Enhanced validation** throughout swap pipeline

### **Alternative Approach**
Consider using the same transaction submission path that **Freighter uses** for PasskeyID transactions, since Freighter swaps work correctly.

---

**Audit Completed**: March 1, 2026  
**Next Steps**: Prioritize BigInt fix, then CORS resolution  
**Production Status**: **DO NOT DEPLOY** - PasskeyID swaps broken