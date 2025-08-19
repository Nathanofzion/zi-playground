# Edge Functions API Reference

> **Complete documentation for ZI Playground Supabase Edge Functions**  
> **Last Updated:** August 19, 2025

---

## 🎯 Overview

ZI Playground uses a **hybrid architecture** combining Supabase Edge Functions with **DeFi-compliant local storage**:

- **Supabase Edge Functions** - Non-sensitive operations (challenges, metadata)
- **Local Browser Storage** - **DeFi-compliant secret key storage (non-custodial)**
- **PasskeyID + WebAuthn** - Secure authentication without remote key storage

### 🔐 **CRITICAL DeFi Compliance Note**
**ALL STELLAR SECRET KEYS ARE STORED LOCALLY ONLY**. Edge functions handle public operations, authentication challenges, and metadata - but **NEVER** store or process secret keys to maintain DeFi principles.

### Available Functions
- **auth** - WebAuthn challenges and public account management (NO SECRET KEYS)
- **rewards** - User rewards and referral system management
- **health** (planned) - System health checks and monitoring

---

## 🔐 Authentication Function

### Endpoint
```
POST /functions/v1/auth
```

### Purpose
Handles **non-custodial** WebAuthn authentication flow for challenge generation and public account management. **Secret keys never touch the server**.

### 🚨 **DeFi Architecture Notice**
This function operates in **non-custodial mode**:
- ✅ **Generates WebAuthn challenges** (temporary, public data)
- ✅ **Stores public keys and metadata** (safe to store remotely)
- ✅ **Verifies WebAuthn signatures** (public key cryptography)
- 🚫 **NEVER handles secret keys** (stored locally in browser only)
- 🚫 **NEVER signs transactions server-side** (client-side signing only)

### Actions Supported

#### 1. Generate Registration Options
**Action:** `generate-registration-options`  
**Purpose:** Creates WebAuthn registration challenge for new user signup

**Request:**
```json
{
  "action": "generate-registration-options"
}
```

**Response:**
```json
{
  "success": true,
  "options": {
    "rp": {
      "name": "zi-playground",
      "id": "localhost"
    },
    "user": {
      "id": "random-user-id",
      "name": "user@example.com",
      "displayName": "User"
    },
    "challenge": "base64-encoded-challenge",
    "pubKeyCredParams": [
      {
        "alg": -7,
        "type": "public-key"
      },
      {
        "alg": -257,
        "type": "public-key"
      }
    ],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "userVerification": "required"
    }
  }
}
```

#### 2. Verify Registration
**Action:** `verify-registration`  
**Purpose:** Verifies passkey registration and stores **public account data only**

**Request:**
```json
{
  "action": "verify-registration",
  "credential": {
    "id": "credential-id",
    "rawId": "raw-credential-id",
    "response": {
      "attestationObject": "base64-encoded-attestation",
      "clientDataJSON": "base64-encoded-client-data"
    },
    "type": "public-key"
  },
  "stellarPublicKey": "GCTZW4APT7AMBUYJ67PSOYG4T6STIFQW2VDRRTXPJXGZFGKQZEUHDDCO"
}
```

**🔐 DeFi Note:** Client sends **public key only** after generating the full keypair locally. Secret key never leaves the browser.

**Response:**
```json
{
  "success": true,
  "user": {
    "user_id": "verified-user-id",
    "publicKey": "GCTZW4APT7AMBUYJ67PSOYG4T6STIFQW2VDRRTXPJXGZFGKQZEUHDDCO",
    "passkey_id": "credential-id"
  },
  "stellar": {
    "publicKey": "GCTZW4APT7AMBUYJ67PSOYG4T6STIFQW2VDRRTXPJXGZFGKQZEUHDDCO",
    "network": "testnet",
    "note": "Secret key stored locally only - not on server"
  }
}
```

#### 3. Generate Authentication Options
**Action:** `generate-authentication-options`  
**Purpose:** Creates WebAuthn authentication challenge for user login

**Request:**
```json
{
  "action": "generate-authentication-options",
  "userHandle": "optional-user-identifier"
}
```

**Response:**
```json
{
  "success": true,
  "options": {
    "challenge": "base64-encoded-challenge",
    "timeout": 60000,
    "rpId": "localhost",
    "userVerification": "required",
    "allowCredentials": [
      {
        "id": "credential-id",
        "type": "public-key"
      }
    ]
  }
}
```

#### 4. Verify Authentication
**Action:** `verify-authentication`  
**Purpose:** Verifies passkey login and returns **public user session data**

**Request:**
```json
{
  "action": "verify-authentication",
  "credential": {
    "id": "credential-id",
    "rawId": "raw-credential-id",
    "response": {
      "authenticatorData": "base64-encoded-auth-data",
      "clientDataJSON": "base64-encoded-client-data",
      "signature": "base64-encoded-signature"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "user_id": "authenticated-user-id",
    "publicKey": "GCTZW4APT7AMBUYJ67PSOYG4T6STIFQW2VDRRTXPJXGZFGKQZEUHDDCO",
    "email": "user@example.com",
    "role": "user"
  },
  "session": {
    "token": "jwt-session-token",
    "expires": "2025-08-20T10:00:00Z"
  },
  "defi_note": "Secret keys remain in your browser - server never sees them"
}
```

#### ~~5. Sign Transaction~~ 🚫 **REMOVED - DeFi Violation**
**❌ REMOVED:** Server-side transaction signing violates DeFi principles.  
**✅ REPLACED:** Client-side signing using locally stored secret keys.

```json
{
  "error": "Transaction signing removed for DeFi compliance",
  "explanation": "Secret keys stored locally only - use client-side signing",
  "alternative": "Use LocalKeyStorage and stellar-sdk for local signing"
}
```

### DeFi-Compliant Implementation

**File Location:** `supabase/functions/auth/index.ts`

**Dependencies:**
- `@simplewebauthn/server` - WebAuthn verification only
- ~~`stellar-sdk`~~ - **Removed server-side signing** 
- `supabase` - Public database operations only

**Environment Variables:**
```env
APP_SUPABASE_URL=your_supabase_url
APP_SUPABASE_ANON_KEY=your_anon_key
RP_NAME=zi-playground
RP_ID=localhost
ORIGIN=http://localhost:3000
JWT_SECRET_KEY=your_jwt_secret_key
# SECRET_KEY removed - no server-side signing
```

**What's NOT in Edge Functions (DeFi Compliance):**
```typescript
// 🚫 REMOVED - DeFi VIOLATIONS
// - Secret key storage
// - Server-side transaction signing
// - Private key operations
// - Custodial wallet functionality

// ✅ CURRENT - DeFi COMPLIANT
// - WebAuthn challenge generation
// - Public key storage
// - Authentication verification
// - Session management
```

---

## 🎁 Rewards Function

### Endpoint
```
POST /functions/v1/rewards
```

### Purpose
Manages user rewards, referral system, and **public reward metadata**. Does not handle fund distribution directly (done via client-side transactions).

### DeFi Architecture Note
- ✅ **Tracks reward eligibility** (public metadata)
- ✅ **Manages referral relationships** (public data)
- ✅ **Records reward history** (public transaction references)
- 🚫 **Does NOT distribute funds** (client-side signing required)

### Current Status
**Version:** Basic implementation (v1.0.0) - DeFi compliant structure

**Request:**
```json
{
  "action": "get-user-rewards",
  "user_id": "user-identifier"
}
```

**Response:**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "reward-uuid",
      "reward_type": "referral",
      "amount": "10.0000000",
      "status": "eligible",
      "stellar_public_key": "GCTZW4....",
      "claim_instructions": "Use client-side signing to claim reward",
      "defi_note": "Funds will be distributed via your local wallet"
    }
  ],
  "total": 1,
  "message": "Rewards tracked publicly - claim via client-side transactions"
}
```

---

## 🔧 DeFi-Compliant Deployment

### Deploy Functions (Non-Custodial Mode)
```bash
# Deploy authentication function (WebAuthn only)
supabase functions deploy auth

# Deploy rewards function (metadata only)  
supabase functions deploy rewards

# Environment variables (no secret keys)
supabase secrets set RP_NAME=zi-playground
supabase secrets set RP_ID=localhost
supabase secrets set ORIGIN=http://localhost:3000
supabase secrets set JWT_SECRET_KEY=your_session_secret
# Note: No Stellar secret keys in environment
```

### DeFi Compliance Verification
```bash
# Verify no secret keys in edge functions
grep -r "secretKey\|privateKey\|secret" supabase/functions/
# Should return no results

# Verify functions only handle public data
grep -r "sign.*transaction\|private.*key" supabase/functions/
# Should return no results
```

---

## 🧪 DeFi-Compliant Testing

### Authentication Flow Test
```bash
# Test WebAuthn challenge generation (public data only)
curl -X POST "http://localhost:54321/functions/v1/auth" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-registration-options"}'

# Expected: WebAuthn options with no secret key references
```

### Verify DeFi Compliance
```bash
# Test that transaction signing is removed
curl -X POST "http://localhost:54321/functions/v1/auth" \
  -H "Content-Type: application/json" \
  -d '{"action": "sign-transaction", "transaction": "test"}'

# Expected: Error message about DeFi compliance
```

---

## 🔐 DeFi Security Model

### Current Architecture (Non-Custodial)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │    │  Edge Functions  │    │  Stellar Network│
│                 │    │                  │    │                 │
│ 🔒 Secret Keys  │────│  WebAuthn Only   │    │  Public Ledger  │
│ 🔒 Local Signing│    │  Public Data     │────│  Transactions   │
│ 🔒 Self-Custody │    │  Challenges      │    │  Balances       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Security Guarantees
- ✅ **Secret keys never leave user's device**
- ✅ **Server cannot access user funds**
- ✅ **No central point of failure for user assets**
- ✅ **Users maintain complete control of their wallets**
- ✅ **Transactions signed client-side only**

### What Edge Functions DON'T Do (DeFi Compliance)
```typescript
// 🚫 DeFi VIOLATIONS - NOT IMPLEMENTED
interface ViolationExamples {
  storeSecretKeys: false;      // Never store secret keys
  signTransactions: false;     // Never sign transactions server-side
  controlUserFunds: false;     // Never have access to user funds
  custodialStorage: false;     // Never act as custodian
  centralizedSigning: false;   // Never centralize signing operations
}
```

---

## 📈 Migration from Custodial to Non-Custodial

### Previous Architecture (❌ Custodial - DeFi Violation)
```typescript
// ❌ REMOVED - DeFi VIOLATION
const signTransaction = async (user_id: string, transaction: string) => {
  const { secretKey } = await supabase
    .from('users')
    .select('secretKey')  // 🚫 Secret keys in database
    .eq('user_id', user_id);
    
  return stellar.signTransaction(transaction, secretKey); // 🚫 Server-side signing
};
```

### Current Architecture (✅ Non-Custodial - DeFi Compliant)
```typescript
// ✅ CURRENT - DeFi COMPLIANT
const generateChallenge = async () => {
  return {
    challenge: generateRandomChallenge(),    // ✅ Public challenge
    expires: Date.now() + 5 * 60 * 1000    // ✅ Temporary data
    // No secret keys involved                ✅ No custodial operations
  };
};

// Client-side signing happens in browser:
// const signedTx = transaction.sign(localSecretKey); ✅
```

---

## 🚨 Error Handling (DeFi-Aware)

### DeFi Compliance Errors
```json
{
  "success": false,
  "error": "Operation violates DeFi principles",
  "details": "Secret keys must remain on user's device",
  "code": "DEFI_VIOLATION_SECRET_KEY_REQUEST",
  "solution": "Use client-side signing with LocalKeyStorage"
}
```

```json
{
  "success": false,
  "error": "Server-side signing disabled",
  "details": "Transaction signing moved to client for self-custody",
  "code": "CUSTODIAL_OPERATION_DISABLED",
  "alternative": "Use @stellar/stellar-sdk client-side signing"
}
```

### Error Codes Reference

| Code | Description | DeFi Impact | Solution |
|------|-------------|-------------|----------|
| `DEFI_VIOLATION_SECRET_KEY_REQUEST` | Request for secret key storage/access | 🚫 Violates self-custody | Use local storage |
| `CUSTODIAL_OPERATION_DISABLED` | Attempt to use custodial features | 🚫 Violates decentralization | Client-side operations |
| `WEBAUTHN_INVALID_SIGNATURE` | WebAuthn signature verification failed | ✅ DeFi-compliant auth | Re-authenticate |
| `PUBLIC_KEY_VALIDATION_FAILED` | Invalid Stellar public key format | ✅ Public data validation | Check key format |

---

## 📚 DeFi Integration Examples

### Non-Custodial Registration Flow
```typescript
import { handleRegister } from '@/lib/passkey';
import { supabase } from '@/lib/supabase';

const registerNonCustodial = async () => {
  // 1. Generate account locally (DeFi compliant)
  const { token, publicKey } = await handleRegister();
  // Secret key stored in localStorage only!
  
  // 2. Get WebAuthn challenge from server (public data)
  const { data: options } = await supabase.functions.invoke('auth', {
    body: { action: 'generate-registration-options' }
  });
  
  // 3. Complete WebAuthn registration
  const credential = await startRegistration({ optionsJSON: options });
  
  // 4. Send public data only to server
  const { data: result } = await supabase.functions.invoke('auth', {
    body: { 
      action: 'verify-registration',
      credential,
      stellarPublicKey: publicKey  // ✅ Public key only
      // secretKey never sent!      // ✅ DeFi compliant
    }
  });
  
  return result;
};
```

### Non-Custodial Transaction Signing
```typescript
import { handleSign } from '@/lib/passkey';
import { TransactionBuilder } from '@stellar/stellar-sdk';

const signTransactionLocally = async (xdr: string) => {
  // ✅ DeFi COMPLIANT: Client-side signing only
  const signedXdr = await handleSign(xdr);
  
  // ❌ NOT THIS: Server-side signing (DeFi violation)
  // const signed = await supabase.functions.invoke('auth', {
  //   body: { action: 'sign-transaction', transaction: xdr }
  // });
  
  return signedXdr;
};
```

---

## ✅ Current Status (DeFi Compliant)

### ✅ Production Ready (Non-Custodial)
- **auth** function - WebAuthn challenges and public data only
- **Local secret storage** - All secret keys in browser localStorage
- **Client-side signing** - Transaction signing happens locally
- **Public metadata** - Only non-sensitive data on server
- **DeFi compliance** - True self-custody achieved

### 🚧 DeFi-Compliant Features In Development
- **rewards** function - Public reward tracking (no fund distribution)
- **health** function - Public system monitoring
- **audit trails** - Public transaction references
- **backup tools** - Client-side key export/import

### 🚫 Custodial Features Removed (DeFi Compliance)
- ❌ **Server-side secret key storage** - Moved to local storage
- ❌ **Server-side transaction signing** - Moved to client-side
- ❌ **Custodial fund management** - Users control their funds
- ❌ **Centralized key recovery** - Users manage their own backups

---

## 🎯 DeFi Compliance Summary

### Core Principles Achieved ✅
- [x] **Self-Custody**: Users control their secret keys
- [x] **Non-Custodial**: No server access to user funds  
- [x] **Decentralized**: No central authority over user assets
- [x] **Trustless**: No need to trust server with funds
- [x] **Permissionless**: Users can create accounts independently
- [x] **Transparent**: All operations visible and verifiable

### Architecture Guarantees ✅
- [x] **Secret keys never transmitted** to any server
- [x] **Transaction signing** happens in user's browser only
- [x] **Fund access** controlled exclusively by user
- [x] **Server compromise** cannot affect user funds
- [x] **User sovereignty** maintained at all times

---

**Last Updated:** August 19, 2025  
**Version:** 2.0.0 - DeFi Compliant Architecture ✅  
**Status:** Fully non-custodial, secret keys stored locally only

**Key Achievement**: Successfully migrated from custodial edge functions to DeFi-compliant architecture where server handles only public data and WebAuthn challenges, while all secret keys and transaction signing remain on the user's device.

**DeFi Principle**: "Not your keys, not your crypto" - Now fully upheld ✅

For DeFi compliance details, see [DeFi Keys Stored Locally - Resolved](../development/DefiKeysStoredLocally-Resolved.md).  
For database schema (public data only), see [Database Schema](./database-schema.md).  
For local storage implementation, see [LocalKeyStorage Reference](../lib/localkeyStorage.md).