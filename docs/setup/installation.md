# Installation Guide

> **Complete setup instructions for ZI Playground development environment**  
> **Last Updated:** January 21, 2025

---

## 🎯 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** `18.0.0` or higher
- **pnpm** `8.0.0` or higher (recommended) or npm/yarn
- **Git** for version control
- **VS Code** (recommended) with TypeScript support

### Accounts & Services
- **GitHub Account** - For repository access
- **Supabase Account** - For backend services
- **Stellar Account** (optional) - For blockchain integration testing

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/Nathanofzion/zi-playground.git
cd zi-playground

# Switch to development branch
git checkout dev
```

### 2. Install Dependencies
```bash
# Install all project dependencies
pnpm install

# Alternative with npm
# npm install
```

### 3. Supabase Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Start local Supabase instance
supabase start

# Apply database migrations
supabase db reset
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 5. Start Development Server
```bash
# Start the development server
pnpm dev

# Open browser to http://localhost:3000
```

---

## 🔧 Detailed Setup

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Edge Function Environment
APP_SUPABASE_URL=your_supabase_project_url
APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# WebAuthn Configuration
RP_NAME=zi-playground
RP_ID=localhost
ORIGIN=http://localhost:3000

# Security
SECRET_KEY=your_jwt_secret_key_here

# Stellar Network Configuration (optional)
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org

# Development
NODE_ENV=development
```

### Database Schema Setup

The project requires specific database tables and columns. Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users table with passkey authentication support
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  "publicKey" TEXT,
  "secretKey" TEXT,
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

-- Challenges table for WebAuthn
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  challenge_id TEXT,
  challenge TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_publickey ON users("publicKey");
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id ON challenges(challenge_id);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);
```

### Edge Functions Deployment

Deploy the required Edge Functions to your Supabase project:

```bash
# Deploy authentication function
supabase functions deploy auth

# Deploy rewards function  
supabase functions deploy rewards

# Set environment variables for Edge Functions
supabase secrets set RP_NAME=zi-playground
supabase secrets set RP_ID=localhost
supabase secrets set ORIGIN=http://localhost:3000
supabase secrets set SECRET_KEY=your_jwt_secret_key_here
```

---

## 🧪 Verification

### Test Basic Functionality

1. **Development Server**
   ```bash
   pnpm dev
   # Should start on http://localhost:3000
   ```

2. **Database Connection**
   ```bash
   supabase status
   # Should show all services running
   ```

3. **Passkey Authentication**
   - Visit http://localhost:3000
   - Try registering with a passkey
   - Check browser console for clean logs (no errors)

4. **Edge Functions**
   ```bash
   # Test auth function
   curl -X POST "http://localhost:54321/functions/v1/auth" \
     -H "Content-Type: application/json" \
     -d '{"action": "generate-registration-options"}'
   
   # Should return WebAuthn options
   ```

### Performance Verification

✅ **Expected Performance Metrics:**
- **Memory Usage:** ~100MB (down from 500MB)
- **Load Time:** ~2 seconds (down from 5 seconds)  
- **Console Errors:** 0 (down from 100+)
- **Asset Balance Queries:** Graceful error handling, no retry loops

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues
```bash
# Reset local Supabase
supabase stop
supabase start

# Check status
supabase status
```

#### 2. Database Schema Errors
```bash
# Error: "Could not find column"
# Solution: Run the database setup SQL commands above
```

#### 3. Asset Balance Console Spam
```bash
# Error: Repeated "trustline missing" errors
# Solution: Already fixed in useAssets.tsx with smart error handling
```

#### 4. Edge Function CORS Errors
```bash
# Error: CORS policy blocked
# Solution: Already fixed with proper CORS headers in Edge Functions
```

#### 5. Git Push Issues
```bash
# Error: non-fast-forward
# Solution: Use dev branch workflow
git checkout dev
git pull origin dev
git push origin dev
```

### Debug Commands

```bash
# Check all services
supabase status

# View logs
supabase functions logs auth
supabase logs

# Test database connection
supabase db ping

# Check environment variables
supabase secrets list

# Restart everything
supabase stop && supabase start
```

---

## 📦 Package Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:reset         # Reset local database
pnpm db:seed          # Seed database with test data

# Testing
pnpm test             # Run tests
pnpm test:e2e         # Run end-to-end tests

# Linting & Formatting
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier

# Supabase
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:reset   # Reset Supabase instance
```

---

## 🎯 Development Workflow

### Daily Development
```bash
# 1. Start development environment
git checkout dev
supabase start
pnpm dev

# 2. Make changes and test locally

# 3. Commit changes
git add .
git commit -m "feat: description of changes"
git push origin dev

# 4. When ready for release
git checkout main
git merge dev
git push origin main
```

### Adding New Features
1. Create feature branch from `dev`
2. Implement changes with proper error handling
3. Add to `docs/development/issues-resolved.md`
4. Test thoroughly
5. Merge to `dev` branch
6. Deploy to main when stable

---

## ✅ Installation Complete

After following this guide, you should have:

- ✅ **Full development environment** running locally
- ✅ **Passkey authentication** working end-to-end  
- ✅ **Database** properly configured with all required tables
- ✅ **Edge Functions** deployed and functional
- ✅ **Asset balance queries** with smart error handling
- ✅ **Clean console logs** with no error spam
- ✅ **Proper git workflow** for collaborative development

### Next Steps
- Review [Issues Resolved](../development/issues-resolved.md) for current system status
- Check [Troubleshooting Guide](../development/troubleshooting.md) for common issues
- Start developing new features following the established patterns

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Status:** Core infrastructure stable ✅

For questions or issues, refer to the [troubleshooting guide](../development/troubleshooting.md) or check the [issues resolved log](../development/issues-resolved.md).