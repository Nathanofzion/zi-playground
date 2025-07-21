# Environment Configuration

> **Detailed guide for setting up environment variables and configuration**  
> **Last Updated:** January 21, 2025

---

## 🔐 Environment Variables

### Required Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Edge Function Environment  
APP_SUPABASE_URL=https://your-project.supabase.co
APP_SUPABASE_ANON_KEY=your_anon_key_here

# WebAuthn/Passkey Configuration
RP_NAME=zi-playground
RP_ID=localhost
ORIGIN=http://localhost:3000

# Security
SECRET_KEY=your_32_character_secret_key_here

# Stellar Network (Optional)
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org

# Development
NODE_ENV=development
```

### How to Get Values

#### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

#### Secret Key Generation
```bash
# Generate a secure 32-character secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🌍 Environment Types

### Development (.env.local)
```env
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
RP_ID=localhost
ORIGIN=http://localhost:3000
```

### Production (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
```

### Testing (.env.test)
```env
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# Test-specific configurations
```

---

## 🔧 Configuration Files

### Next.js Configuration
See `next.config.js` for build-time configuration.

### Supabase Configuration  
See `supabase/config.toml` for local Supabase settings.

### TypeScript Configuration
See `tsconfig.json` for TypeScript compiler options.

---

**Last Updated:** January 21, 2025