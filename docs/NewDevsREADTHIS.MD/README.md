## 🔒 Environment Setup

### Initial Setup
1. Copy environment template: `cp .env.example .env.local`
2. Fill in your actual values in `.env.local`
3. Never commit `.env*` files - they're protected by `.gitignore`

### Required Environment Variables
- `DATABASE_URL` - Your database connection
- `ADMIN_SECRET_KEY` - Stellar admin account for airdrops
- `NEXTAUTH_SECRET` - Authentication secret
- See `.env.example` for complete list

### Security Notes
- ✅ `.env` files are automatically ignored by git
- ✅ Use `.env.local` for development
- ✅ Use `.env.production` for production (also ignored)
- ❌ Never commit actual environment values