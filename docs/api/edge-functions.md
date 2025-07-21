# Edge Functions API Reference

> **Complete documentation for ZI Playground Supabase Edge Functions**  
> **Last Updated:** January 21, 2025

---

## 🎯 Overview

ZI Playground uses Supabase Edge Functions for server-side logic, authentication, and blockchain integration. All functions are deployed as Deno-based serverless functions with proper CORS handling and error management.

### Available Functions
- **auth** - WebAuthn passkey authentication and Stellar account management
- **rewards** - User rewards and referral system management
- **health** (planned) - System health checks and monitoring

---

## 🔐 Authentication Function

### Endpoint
```
POST /functions/v1/auth
```

### Purpose
Handles complete passkey authentication flow including WebAuthn registration, login, and Stellar account creation/management.

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

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to generate registration options",
  "details": "Specific error message"
}
```

#### 2. Verify Registration
**Action:** `verify-registration`  
**Purpose:** Verifies passkey registration and creates Stellar account

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
  }
}
```

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
    "network": "testnet"
  }
}
```

#### 3. Generate Authentication Options
**Action:** `generate-authentication-options`  
**Purpose:** Creates WebAuthn authentication challenge for user login

**Request:**
```json
{
  "action": "generate-authentication-options"
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
    "userVerification": "required"
  }
}
```

#### 4. Verify Authentication
**Action:** `verify-authentication`  
**Purpose:** Verifies passkey login and returns user session

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
    "expires": "2025-01-22T10:00:00Z"
  }
}
```

#### 5. Sign Transaction
**Action:** `sign-transaction`  
**Purpose:** Signs Stellar transactions using user's stored private key

**Request:**
```json
{
  "action": "sign-transaction",
  "user_id": "user-identifier",
  "transaction": "base64-encoded-stellar-transaction"
}
```

**Response:**
```json
{
  "success": true,
  "signedTransaction": "base64-encoded-signed-transaction",
  "transactionHash": "stellar-transaction-hash"
}
```

### Implementation Details

**File Location:** `supabase/functions/auth/index.ts`

**Dependencies:**
- `@simplewebauthn/server` - WebAuthn verification
- `stellar-sdk` - Stellar blockchain integration
- `supabase` - Database operations

**Environment Variables:**
```env
APP_SUPABASE_URL=your_supabase_url
APP_SUPABASE_ANON_KEY=your_anon_key
RP_NAME=zi-playground
RP_ID=localhost
ORIGIN=http://localhost:3000
SECRET_KEY=your_jwt_secret_key
```

**CORS Configuration:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
```

**Error Handling:**
- Validates all input parameters
- Handles WebAuthn verification failures gracefully
- Manages database connection errors
- Returns structured error responses

---

## 🎁 Rewards Function

### Endpoint
```
POST /functions/v1/rewards
```

### Purpose
Manages user rewards, referral system, and token distribution.

### Current Status
**Version:** Basic implementation (v1.0.0)  
**Features:** CORS handling, basic structure ready for implementation

**Request:**
```json
{
  "action": "get-user-rewards",
  "user_id": "user-identifier"
}
```

**Current Response:**
```json
{
  "success": true,
  "rewards": [],
  "total": 0,
  "message": "Rewards system in development"
}
```

### Planned Actions

#### 1. Get User Rewards
**Action:** `get-user-rewards`  
**Purpose:** Retrieve all rewards for a specific user

**Planned Request:**
```json
{
  "action": "get-user-rewards",
  "user_id": "user-identifier",
  "filters": {
    "status": "processed",
    "reward_type": "referral"
  }
}
```

**Planned Response:**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "reward-uuid",
      "reward_type": "referral",
      "amount": "10.0000000",
      "description": "Referral bonus for new user signup",
      "status": "processed",
      "transaction_hash": "stellar-tx-hash",
      "created_at": "2025-01-21T10:00:00Z",
      "processed_at": "2025-01-21T10:05:00Z"
    }
  ],
  "total": 1,
  "total_amount": "10.0000000"
}
```

#### 2. Process Referral
**Action:** `process-referral`  
**Purpose:** Award referral bonus when new user signs up

**Planned Request:**
```json
{
  "action": "process-referral",
  "referrer_id": "referring-user-id",
  "referee_id": "new-user-id",
  "referral_code": "REF123456"
}
```

#### 3. Distribute Rewards
**Action:** `distribute-rewards`  
**Purpose:** Process pending rewards and create Stellar transactions

### Implementation Status

**File Location:** `supabase/functions/rewards/index.ts`

**Current Implementation:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      rewards: [], 
      total: 0,
      message: "Rewards system in development"
    }),
    { status: 200, headers: corsHeaders }
  );
});
```

---

## 🏥 Health Function (Planned)

### Endpoint
```
GET /functions/v1/health
```

### Purpose
System health monitoring and status checks.

### Planned Features
- Database connectivity check
- Edge function status
- Stellar network connectivity
- Performance metrics

---

## 🔧 Deployment

### Deploy All Functions
```bash
# Deploy authentication function
supabase functions deploy auth

# Deploy rewards function
supabase functions deploy rewards

# Deploy with environment variables
supabase secrets set RP_NAME=zi-playground
supabase secrets set RP_ID=localhost
supabase secrets set ORIGIN=http://localhost:3000
supabase secrets set SECRET_KEY=your_secret_key
```

### Environment Setup
```bash
# Required secrets for Edge Functions
supabase secrets set APP_SUPABASE_URL=your_supabase_url
supabase secrets set APP_SUPABASE_ANON_KEY=your_anon_key
supabase secrets set RP_NAME=zi-playground
supabase secrets set RP_ID=localhost
supabase secrets set ORIGIN=http://localhost:3000
supabase secrets set SECRET_KEY=your_jwt_secret_key

# Verify secrets
supabase secrets list
```

### Local Development
```bash
# Start functions locally
supabase functions serve

# Functions available at:
# http://localhost:54321/functions/v1/auth
# http://localhost:54321/functions/v1/rewards
```

---

## 🧪 Testing

### Authentication Function Tests

#### Test Registration Flow
```bash
# Generate registration options
curl -X POST "http://localhost:54321/functions/v1/auth" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-registration-options"}'

# Expected: WebAuthn registration options
```

#### Test Authentication Flow
```bash
# Generate authentication options
curl -X POST "http://localhost:54321/functions/v1/auth" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-authentication-options"}'

# Expected: WebAuthn authentication challenge
```

### Rewards Function Tests

#### Test Basic Response
```bash
# Test rewards endpoint
curl -X POST "http://localhost:54321/functions/v1/rewards" \
  -H "Content-Type: application/json" \
  -d '{"action": "get-user-rewards", "user_id": "test"}'

# Expected: Empty rewards array with success status
```

### CORS Tests

#### Test Preflight Requests
```bash
# Test CORS preflight
curl -X OPTIONS "http://localhost:54321/functions/v1/auth" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"

# Expected: 200 status with CORS headers
```

---

## 📊 Monitoring

### Function Logs
```bash
# View auth function logs
supabase functions logs auth

# View rewards function logs
supabase functions logs rewards

# Follow logs in real-time
supabase functions logs auth --follow
```

### Performance Metrics
```bash
# Function execution stats
supabase functions stats

# Database connection monitoring
supabase logs db
```

---

## 🚨 Error Handling

### Common Error Patterns

#### Authentication Errors
```json
{
  "success": false,
  "error": "WebAuthn verification failed",
  "details": "Invalid signature",
  "code": "WEBAUTHN_INVALID_SIGNATURE"
}
```

#### Database Errors
```json
{
  "success": false,
  "error": "Database operation failed",
  "details": "Could not find user",
  "code": "USER_NOT_FOUND"
}
```

#### Network Errors
```json
{
  "success": false,
  "error": "Stellar network error",
  "details": "Transaction submission failed",
  "code": "STELLAR_NETWORK_ERROR"
}
```

### Error Codes Reference

| Code | Description | Action |
|------|-------------|---------|
| `WEBAUTHN_INVALID_SIGNATURE` | WebAuthn signature verification failed | Re-authenticate |
| `USER_NOT_FOUND` | User doesn't exist in database | Register new user |
| `CHALLENGE_EXPIRED` | Authentication challenge expired | Generate new challenge |
| `STELLAR_NETWORK_ERROR` | Stellar blockchain error | Retry transaction |
| `INVALID_ACTION` | Unknown action parameter | Check API documentation |
| `MISSING_PARAMETERS` | Required parameters missing | Validate request body |

---

## 🔐 Security Considerations

### Authentication Security
- **Challenge Validation:** All WebAuthn challenges expire after 5 minutes
- **Signature Verification:** Full cryptographic verification of passkey signatures
- **Replay Protection:** Counter-based replay attack prevention
- **Database Security:** Row Level Security (RLS) on all user data

### API Security
- **CORS Policies:** Strict origin validation for production
- **Rate Limiting:** (Planned) Request rate limiting per user
- **Input Validation:** All inputs validated and sanitized
- **Error Handling:** No sensitive information in error responses

### Stellar Integration Security
- **Private Key Storage:** Encrypted storage of Stellar private keys
- **Transaction Signing:** Server-side signing with user authorization
- **Network Validation:** Transaction validation before submission
- **Audit Trail:** All transactions logged with user identification

---

## 📈 Performance Optimization

### Response Time Targets
- **Authentication Flow:** < 2 seconds end-to-end
- **Registration Flow:** < 3 seconds including Stellar account creation
- **Reward Queries:** < 500ms for user reward history
- **Health Checks:** < 100ms for status responses

### Optimization Strategies
- **Database Indexing:** Optimized queries with proper indexes
- **Connection Pooling:** Efficient database connection management
- **Caching:** (Planned) Redis caching for frequent queries
- **Async Processing:** Background processing for non-critical operations

---

## 🔄 Version History

### Version 1.0.0 - Current
- ✅ **auth** function with complete WebAuthn flow
- ✅ **rewards** function with basic structure
- ✅ Proper CORS handling for all functions
- ✅ Error handling and validation
- ✅ Stellar blockchain integration

### Version 1.1.0 - Planned
- 🚧 Full rewards system implementation
- 🚧 Health monitoring function
- 🚧 Rate limiting and enhanced security
- 🚧 Performance optimization and caching
- 🚧 Comprehensive testing suite

---

## 📚 Integration Examples

### Frontend Integration

#### Registration Flow
```typescript
import { supabase } from '@/lib/supabase';

// Generate registration options
const { data: options } = await supabase.functions.invoke('auth', {
  body: { action: 'generate-registration-options' }
});

// Complete WebAuthn registration
const credential = await startRegistration({ optionsJSON: options });

// Verify registration
const { data: result } = await supabase.functions.invoke('auth', {
  body: { 
    action: 'verify-registration',
    credential 
  }
});
```

#### Authentication Flow
```typescript
// Generate authentication options
const { data: options } = await supabase.functions.invoke('auth', {
  body: { action: 'generate-authentication-options' }
});

// Complete WebAuthn authentication
const credential = await startAuthentication(options);

// Verify authentication
const { data: result } = await supabase.functions.invoke('auth', {
  body: { 
    action: 'verify-authentication',
    credential 
  }
});
```

### React Hook Integration
```typescript
const usePasskeyAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Registration flow using auth function
      const { data: options } = await supabase.functions.invoke('auth', {
        body: { action: 'generate-registration-options' }
      });

      const credential = await startRegistration({ optionsJSON: options });
      
      const { data: result } = await supabase.functions.invoke('auth', {
        body: { action: 'verify-registration', credential }
      });

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
```

---

## ✅ Current Status

### ✅ Production Ready
- **auth** function - Complete WebAuthn and Stellar integration
- **CORS handling** - All functions properly configured
- **Error handling** - Comprehensive error management
- **Security** - WebAuthn and database security implemented
- **Documentation** - Complete API reference available

### 🚧 In Development
- **rewards** function - Full implementation pending
- **health** function - Monitoring and status checks
- **rate limiting** - API usage limits and throttling
- **caching** - Performance optimization with Redis
- **testing** - Automated test suite for all functions

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Status:** Authentication function production ready, rewards system in development ✅

For setup instructions, see [Installation Guide](../setup/installation.md).  
For database schema, see [Database Schema](./database-schema.md).  
For troubleshooting, see [Issues Resolved](../development/issues-resolved.md).