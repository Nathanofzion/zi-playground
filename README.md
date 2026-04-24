# 🚀 Zig3 V3 Smart Wallet using the Stellar Blockchain & Soroban smart contracts for Passkey Id wallets, $Zi Airdrop with Classic games, Reward Referral System, Atomic asset Swaps & Liquidity pools. Play & Earn with this GameFi Dapp

<div align="center">

<p>
  <a href="https://zioncoin.org.uk/">
    <img src="https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png" alt="Zioncoin.org.uk"/>
  </a>
</p>

<p>
  <a href="https://stellar.org/">
    <img src="https://cdn.sanity.io/images/e2r40yh6/production-i18n/0a68a5dca134b65df72fd765865b65af68233e64-3104x1072.png?w=1440&auto=format&dpr=2" alt="Stellar.org"/>
  </a>
</p>

<p>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" alt="Next.js"/>
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  </a>
  <a href="https://next-auth.js.org/">
    <img src="https://img.shields.io/badge/NextAuth.js-black?style=for-the-badge&logo=nextauth&logoColor=white" alt="NextAuth.js"/>
  </a>
  <a href="https://vercel.com/">
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
  </a>
  <a href="https://www.tremor.so">
    <img src="https://img.shields.io/badge/Tremor-FD0061?style=for-the-badge" alt="Tremor"/>
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  </a>
</p>

**Stellar, Zig3 v3 Airdrop dapp, Next.js 14** web Rewards magic link referral system (inspired by Slack 😎, Notion 📝, and Figma 🎨) built with **Next Auth** and **Soroban**. Styled with **Tremor** components and **Tailwind CSS**.

</div>

## 🚩 Overview

**Zi Airdrop Playground** is a decentralized application (dApp) built with **Next.js 14** for the new Zig3 v3 Smart wallet, combining features for secure airdrop management with a referral system inspired by modern platforms like Slack, Notion, and Figma. It leverages blockchain technology, WebAuthn for authentication, and a magic link referral system. The project is developer-friendly, responsive, and optimized for deployment on **Vercel**.

### Key Features

1. **Airdrop Management**: Distribute digital assets to multiple recipients via blockchain smart contracts.
2. **Referral System**: Magic link-based referrals powered by **Supabase**, inspired by collaborative platforms.
3. **WebAuthn Authentication**: Passkey-based secure key encryption (secp256r1 curve) for local device for user authentication; no passwords downloads, no username.
4. **Responsive Design**: Optimized for desktop and mobile using **Chakra UI** components.
5. **Blockchain Integration**: Stellar Soroban Smart contract interactions for secure asset transfers, Airdrops, atomic swaps, liquidity pools, staking, sending and receiving.
6. **Analytics**: Integrated **Vercel Analytics** for tracking usage.
7. **Classic Games**: Zig3 v3 Airdrop playground introduces classic games like **Space Invaders** and **Blockchain Tetris** where the user is paid to play.

### Tech Stack

1. **Frontend**: Next.js 14 (React, TypeScript, server-side rendering)
2. **Backend**: Supabase (serverless functions, database, referral system)
3. **Authentication**: WebAuthn (passkeys)
4. **Styling**: Chakra UI
5. **Blockchain**: Smart contracts for airdrops
6. **Deployment**: Vercel (preview mode, cache invalidation) Supabase (edge function, database)
7. **Tools**: ESLint, Prettier, Vercel Analytics

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/en)
- [Vercel](https://vercel.com) account
- [SendGrid](https://sendgrid.com/en-us) account
- [Docker Desktop](https://docs.docker.com/desktop/) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed globally
- [Launchtube](https://github.com/Nathanofzion/launchtube) API keys required
- [Mercury](https://main.mercurydata.app/) API keys required
- [Soroswap](https://github.com/soroswap) API keys required

### Installation

1. The project uses [pnpm](https://pnpm.io/installation) for the package manager therefore you should install pnpm globally:

```bash
npm install -g pnpm
```

2. **Clone Your Fork**: Clone the forked repository to your local machine:

```bash
git clone https://github.com/<your-username>/zi-playground.git
```

3. **Install Node modules**:

```bash
pnpm install
```

### Configuration & Environment Variables

Add credentials for:
- **Soroban** (for referral system)
- **Supabase** (for serverless functions and database)
- **SendGrid** (for email-based magic links)
- **Stellar Blockchain keys** (e.g., wallet or contract addresses)

### Run Development Server

**Important**: This project requires Supabase to run locally.
First, install the Supabase CLI globally:
[How to install Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### Running Supabase Locally

**Prerequisites**:
- Docker Desktop installed and running
- Supabase CLI installed globally
- Node.js 20+ installed

**Setup Steps**:

1. Initialize Supabase (if not already done):

```bash
supabase init
```

2. Start Supabase services:

```bash
supabase start
supabase functions serve --env-file ./supabase/.env.development
```

3. Migrate database (leave Start Supabase services running, open another terminal if not already done):

```bash
supabase db reset
```

4. Synchronize liquidity pair list with router contract (if not already done):

```bash
curl -L -X POST 'http://localhost:54321/functions/v1/soroswap' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -H 'Content-Type: application/json' \
  --data '{"action":"sync"}'
```

This will start all required services including:
- PostgreSQL database
- Supabase Auth
- Storage
- Edge Functions
- Studio (web interface)

5. Access Supabase Studio:
- Open [http://localhost:54323](http://localhost:54323)
- Default credentials:
  - Email: `supabase`
  - Password: `supabase`

6. Database Management:
- Use Studio to manage your database schema
- Create tables, policies, and functions
- Monitor database performance

7. Run command below (pnpm dev) then Open [http://localhost:3000](http://localhost:3000) to view the app:

```bash
pnpm dev
```

8. Stop Supabase services:

```bash
supabase stop
```

**Troubleshooting**:
- If services fail to start, ensure Docker is running
- Check logs with `supabase logs`
- Reset local database with `supabase db reset`

### Edit and Develop

- Modify `app/page.tsx` for frontend changes (auto-updates in development)
- Customize smart contracts or backend logic as needed

---

## 🚢 Deployment

### Deploy to Vercel

1. **Build Project Locally**:

```bash
pnpm run build
```

2. **Preview Project Locally**:

```bash
pnpm preview
```

3. **Update .env.production with Supabase URL and anon key**

**Vercel** is the recommended platform for deployment:
1. Push the repository to a Git provider (e.g., GitHub)
2. Import the project into Vercel
3. Configure environment variables in Vercel's dashboard
4. Deploy with automatic scaling, preview mode, and serverless functions

Refer to [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

### Deploy to Supabase

1. **Create a Supabase Account** (if you don't have)
   - Visit [Supabase](https://supabase.com) and sign up for a new account

2. **Create a New Project** (if not already done)
   - Click on "New Project"
   - Fill in project details (name, password, and region) and click "Create new project"

3. **Get API Credentials**
   - Go to the "API" section in your Supabase dashboard
   - Note your `API URL` and `anon/public key`

4. **Login to Supabase** (if not already done):

```bash
supabase login
```

5. **Link to Supabase project** (if not already done):

```bash
supabase link
```

6. **Migrate database** (if not already done):

```bash
supabase db push
```

7. **Deploy Supabase edge functions** (if some feature changed after last deployment):

```bash
supabase functions deploy
```

8. **Add (or Update if exist) following secrets to Supabase**:

```
SECRET_KEY
RP_NAME
RP_ID
ORIGIN
SOROBAN_RPC_URL
NETWORK_PASSPHRASE
SOROSWAP_FACTORY
FUNDER_PUBLIC_KEY
FUNDER_SECRET_KEY
ZION_TOKEN_ADDRESS
```

9. **Synchronize liquidity pairs with Soroswap smart contracts**:

```bash
curl -L -X POST '<SUPABASE_URL>' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  --data '{"action":"sync"}'
```

## Additional Resources

- **Next.js**: [Docs](https://nextjs.org/docs) | [Tutorial](https://nextjs.org/learn) | [GitHub](https://github.com/vercel/next.js)
- **Supabase**: [Docs](https://supabase.com/docs)
- **WebAuthn**: [Guide](https://webauthn.guide)
- **Chakra UI**: [Docs](https://chakra-ui.com/docs/get-started/installation)
- **Passkeys**: [Docs](https://developers.stellar.org/docs/build/apps/guestbook/setup-passkeys)
- **Soroban**: [Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)

---

## 🔐 Mainnet Launch Checklist

> **All keys in git history are testnet-only and have no real value.**
> Before going live on mainnet, complete every item below.

### Keys — Generate fresh, never reuse testnet keys

- [ ] Generate new **Stellar funder keypair** (`FUNDER_PUBLIC_KEY` / `FUNDER_SECRET_KEY`) — fund with real XLM
- [ ] Generate new **OpenZeppelin Relayer API key** (`NEXT_PUBLIC_RELAYER_API_KEY`) from [channels.openzeppelin.com](https://channels.openzeppelin.com)
- [ ] Obtain new **Mercury JWT** (`MERCURY_JWT`) for mainnet Mercury project
- [ ] Create a **new Supabase project** (separate from testnet) and copy fresh `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- [ ] Rotate `SECRET_KEY` used for JWT signing in Supabase edge functions

### Contracts — Redeploy on mainnet

- [ ] Deploy smart wallet factory contract → update `NEXT_PUBLIC_FACTORY_CONTRACT_ID`
- [ ] Deploy/verify WASM → update `NEXT_PUBLIC_WALLET_WASM_HASH`
- [ ] Deploy airdrop contract → update `NEXT_PUBLIC_AIRDROP_CONTRACT_ID`
- [ ] Update `NEXT_PUBLIC_NETWORK_PASSPHRASE` to `Public Global Stellar Network ; September 2015`
- [ ] Update `NEXT_PUBLIC_RPC_URL` to a mainnet RPC endpoint
- [ ] Update Soroswap router + factory to mainnet addresses

### Supabase

- [ ] Run `supabase db push` against the new mainnet project (includes PQC migration)
- [ ] Deploy all edge functions: `supabase functions deploy`
- [ ] Set all Supabase secrets (`SECRET_KEY`, `FUNDER_SECRET_KEY`, `MERCURY_JWT`, etc.) via `supabase secrets set`
- [ ] Enable Row Level Security (RLS) policies on `users`, `rewards`, `wallet_accounts` tables
- [ ] Set `verify-hybrid` function secrets

### Hosting (Vercel)

- [ ] Add all `NEXT_PUBLIC_` vars to Vercel dashboard environment variables — **never commit them to files**
- [ ] Verify `.env.example` contains no real values
- [ ] Enable Vercel deployment protection for production branch

### Security

- [ ] Confirm `.gitignore` blocks all `.env*` patterns (already done ✅)
- [ ] Run `git ls-tree -r HEAD --name-only | grep .env` — must return only `.env.example`
- [ ] Review Supabase RLS policies before launch
- [ ] Rotate any key that was ever in a committed `.env` file

---

## Contributing

- Fork the repository, make changes, and submit a pull request
- Ensure code adheres to **ESLint** and **Prettier** standards

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.

## ⚖️ License

MIT License - see [LICENSE.md](LICENSE.md) open-source contributions are welcome.

---
