# Database Schema

> **Complete database structure for ZI Playground**  
> **Last Updated:** August 19, 2025

---

## 🗄️ Overview

ZI Playground uses a **hybrid architecture**:
- **Supabase PostgreSQL** - For non-sensitive user metadata and challenges
- **Local Browser Storage** - For DeFi-compliant secret key storage (non-custodial)
- **PasskeyID + WebAuthn** - For secure authentication without remote key storage

### 🔐 DeFi Compliance Note
**CRITICAL**: Stellar secret keys are **NEVER** stored in the database. All secret keys are stored locally in the user's browser to maintain DeFi principles of self-custody and non-custodial wallet architecture.

---

## 📋 Tables

### users
**Purpose:** User metadata and public information (NO SECRET KEYS)

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  "publicKey" TEXT,
  -- NOTE: secretKey field REMOVED for DeFi compliance
  passkey_id TEXT,
  passkey_public_key INTEGER[],
  counter INTEGER DEFAULT 0,
  transports TEXT[],
  email TEXT,
  role TEXT DEFAULT 'user',
  referral_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Columns
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key, auto-generated | PRIMARY KEY |
| `user_id` | TEXT | Unique user identifier for passkeys | UNIQUE, NOT NULL |
| `publicKey` | TEXT | Stellar account public key (public info only) | - |
| ~~`secretKey`~~ | ~~TEXT~~ | **🚫 REMOVED - DeFi Violation** | **Stored locally only** |
| `passkey_id` | TEXT | WebAuthn credential ID | - |
| `passkey_public_key` | INTEGER[] | WebAuthn public key as integer array | - |
| `counter` | INTEGER | WebAuthn signature counter (replay protection) | DEFAULT 0 |
| `transports` | TEXT[] | WebAuthn authenticator transports | - |
| `email` | TEXT | User email address (optional) | - |
| `role` | TEXT | User role (user/admin) | DEFAULT 'user' |
| `referral_count` | INTEGER | Number of successful referrals | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | Account creation timestamp | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | DEFAULT NOW() |

#### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_publickey ON users("publicKey");
CREATE INDEX IF NOT EXISTS idx_users_passkey_id ON users(passkey_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

#### Constraints
```sql
ALTER TABLE users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));
```

---

### challenges
**Purpose:** Temporary storage for WebAuthn authentication challenges

```sql
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  challenge_id TEXT,
  challenge TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);
```

#### Columns
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key, auto-generated | PRIMARY KEY |
| `user_id` | TEXT | Reference to users.user_id | - |
| `challenge_id` | TEXT | Unique challenge identifier | - |
| `challenge` | TEXT | WebAuthn challenge string | NOT NULL |
| `created_at` | TIMESTAMPTZ | Challenge creation time | DEFAULT NOW() |
| `expires_at` | TIMESTAMPTZ | Challenge expiration time | DEFAULT NOW() + 5 minutes |

#### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id ON challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);
```

#### Cleanup Policy
```sql
-- Automatic cleanup of expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every hour (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-challenges', '0 * * * *', 'SELECT cleanup_expired_challenges();');
```

---

## 🔐 DeFi Architecture: Local Storage

### LocalKeyStorage (Browser-Only)
**Purpose:** Non-custodial secret key storage in user's browser

```typescript
// src/lib/localKeyStorage.ts
interface PasskeyData {
  credentialId: string;
  publicKey: string;        // Stellar public key
  secretKey: string;        // 🔒 STORED LOCALLY ONLY
  token: string;
  stellarData: {
    accountId: string;
    sequence: string;
    network: 'testnet' | 'mainnet';
    fundedAt: number;
    balances: Array<{asset: string, balance: string}>;
  };
  createdAt: number;
  lastUsed?: number;
}

class LocalKeyStorage {
  // 🔒 All secret keys stored in browser localStorage only
  static storePasskeyData(credentialId: string, data: PasskeyData): void
  static getPasskeyData(credentialId: string): PasskeyData | null
  static getAllPasskeyData(): Record<string, PasskeyData>
  static clearAll(): void
}
```

### Data Flow Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │    │   Supabase DB    │    │  Stellar Network│
│                 │    │                  │    │                 │
│ 🔒 Secret Keys  │───▶│  Public Keys     │    │  Real Accounts  │
│ 🔒 Local Storage│    │  Metadata Only   │───▶│  Transactions   │
│ 🔒 PasskeyID    │    │  No Secrets!     │    │  Balances       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🚧 Planned Tables

### rewards
**Purpose:** Track user rewards and referral system

```sql
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(20,7) DEFAULT 0,
  description TEXT,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

### game_state
**Purpose:** Store user game progress and activities

```sql
CREATE TABLE game_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  tokens_earned DECIMAL(20,7) DEFAULT 0,
  tokens_spent DECIMAL(20,7) DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Security Architecture

### DeFi Compliance Model
```sql
-- ✅ ALLOWED: Public information only
CREATE TABLE users (
  -- Safe to store remotely
  user_id TEXT UNIQUE NOT NULL,
  "publicKey" TEXT,  -- Public keys are safe
  email TEXT,
  role TEXT,
  -- 🚫 NEVER STORE: secretKey, private keys, seed phrases
);

-- ✅ ALLOWED: Temporary authentication data
CREATE TABLE challenges (
  challenge TEXT NOT NULL,  -- Temporary, expires in 5 minutes
  expires_at TIMESTAMPTZ    -- Auto-cleanup prevents data accumulation
);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own public data
CREATE POLICY "Users can view own public data" ON users
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own metadata" ON users
  FOR UPDATE USING (auth.uid()::text = user_id);
```

### What's NOT in the Database
```sql
-- 🚫 NEVER STORED REMOTELY (DeFi Violation)
-- secretKey TEXT,           -- Stellar secret keys
-- seed_phrase TEXT,         -- Wallet seed phrases
-- private_keys BYTEA,       -- Any private cryptographic material
-- encrypted_keys TEXT,      -- Even encrypted private keys
-- backup_phrases TEXT,      -- Recovery phrases
```

---

## 📊 Current vs Previous Architecture

### ❌ Previous (Custodial - DeFi Violation)
```sql
CREATE TABLE users (
  -- 🚫 CUSTODIAL VIOLATION
  "secretKey" TEXT,  -- Secret keys stored remotely
  -- Users don't control their funds
);
```

### ✅ Current (Non-Custodial - DeFi Compliant)
```sql
CREATE TABLE users (
  -- ✅ DEFI COMPLIANT
  "publicKey" TEXT,  -- Only public information
  -- Secret keys stored locally in user's browser
);
```

### Architecture Benefits
| Aspect | Custodial (Old) | Non-Custodial (Current) |
|--------|-----------------|-------------------------|
| **Key Control** | ❌ Server controlled | ✅ User controlled |
| **DeFi Compliance** | ❌ Violates principles | ✅ Fully compliant |
| **Security Risk** | ❌ Central point of failure | ✅ Individual responsibility |
| **User Sovereignty** | ❌ Users trust server | ✅ Users trust themselves |
| **Backup/Recovery** | ❌ Server-dependent | ✅ User-managed |

---

## 🔧 Setup Commands

### Current Database Setup (DeFi Compliant)
```sql
-- Create users table WITHOUT secret key storage
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  "publicKey" TEXT,                    -- ✅ Public keys only
  -- secretKey TEXT,                   -- 🚫 REMOVED for DeFi compliance
  passkey_id TEXT,
  passkey_public_key INTEGER[],
  counter INTEGER DEFAULT 0,
  transports TEXT[],
  email TEXT,
  role TEXT DEFAULT 'user',
  referral_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table (temporary data only)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  challenge_id TEXT,
  challenge TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);
```

### Migration from Custodial to Non-Custodial
```sql
-- If upgrading from custodial version, remove secret key column
-- ⚠️ WARNING: This will delete all stored secret keys
-- Users will need to reconnect their wallets

-- Backup existing data first
CREATE TABLE users_backup AS SELECT * FROM users;

-- Remove the custodial secret key column
ALTER TABLE users DROP COLUMN IF EXISTS "secretKey";

-- Verify the column is removed
\d users;
```

---

## 🧪 Current Implementation Status

### ✅ Production Ready (DeFi Compliant)
- **users** table - Public metadata only, no secret keys
- **challenges** table - Temporary WebAuthn challenges
- **LocalKeyStorage** - Browser-only secret key management
- **PasskeyID Integration** - Non-custodial authentication
- **Real Stellar Accounts** - Generated locally, funded via friendbot

### 🔍 Data Verification
```sql
-- Verify no secret keys in database
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name ILIKE '%secret%';
-- Should return no results

-- Check user public data only
SELECT user_id, "publicKey", created_at 
FROM users 
LIMIT 5;
-- Should show public keys starting with 'G', no secret keys

-- Verify challenge cleanup
SELECT COUNT(*) as active_challenges 
FROM challenges 
WHERE expires_at > NOW();
-- Should be low number (only active challenges)
```

---

## 🎯 DeFi Compliance Verification

### ✅ Compliance Checklist
- [x] **No Secret Keys in Database** - All secret keys stored locally
- [x] **User Controls Private Keys** - PasskeyID + local storage
- [x] **No Central Authority** - Users can export/backup independently
- [x] **Trustless Architecture** - No need to trust server with funds
- [x] **Self-Custody** - Users maintain full control
- [x] **Decentralized** - No single point of failure for user funds

### 🔍 Audit Commands
```sql
-- Confirm DeFi compliance
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('users', 'challenges')
AND column_name ILIKE ANY (ARRAY['%secret%', '%private%', '%seed%', '%key%']);

-- Should only show: publicKey, passkey_id, passkey_public_key
-- Should NOT show: secretKey, privateKey, seedPhrase, etc.
```

---

## 📈 Migration History

### Version 1.0.0 - Initial Custodial Schema ❌
- ❌ Created `users` table with secret key storage (DeFi violation)
- ❌ Implemented custodial wallet architecture

### Version 2.0.0 - DeFi Compliance Migration ✅
- ✅ **BREAKING CHANGE**: Removed `secretKey` column from users table
- ✅ Implemented LocalKeyStorage for browser-only secret storage
- ✅ Added PasskeyID non-custodial authentication
- ✅ Real Stellar account generation with local key management
- ✅ Achieved full DeFi compliance and user sovereignty

---

## ✅ Current Status

### ✅ DeFi Compliant & Production Ready
- **Non-Custodial Architecture** - Users control their private keys
- **Local Secret Storage** - Keys never leave user's device
- **Real Stellar Integration** - Actual testnet accounts with friendbot funding
- **WebAuthn Security** - Biometric/hardware key protection
- **Self-Custody** - True ownership of digital assets

### 🔐 Security Model
```
User Device Security = User Fund Security
No Server Compromise = No User Fund Loss
Individual Responsibility = Individual Control
```

---

**Last Updated:** August 19, 2025  
**Version:** 2.0.0 - DeFi Compliant  
**Status:** ✅ Production ready, fully non-custodial

**Key Achievement**: Successfully migrated from custodial to non-custodial architecture, achieving true DeFi compliance where users maintain complete control of their Stellar secret keys through local storage and PasskeyID authentication.

For DeFi compliance details, see [DeFi Keys Stored Locally - Resolved](../development/DefiKeysStoredLocally-Resolved.md).  
For setup instructions, see [Installation Guide](../setup/installation.md).