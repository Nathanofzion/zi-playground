<div align="center">

# 🚀 Zig3 V3 Smart Wallet using the Stellar Blockchain & Soroban smart contracts for Passkey Id wallets, $Zi Airdrop with Classic games, Reward Referrel System, Atomic asset Swaps & Liquidity pools. Play & Earn with this GameFi Dapp 


<p align="center">
  <a href="https://zioncoin.org.uk/">
    <img src="https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png" alt="Zioncoin.org.uk"/>
  </a>
</p>

<p align="center">
  <a href="https://stellar.org/">
    <img src="https://cdn.sanity.io/images/e2r40yh6/production-i18n/0a68a5dca134b65df72fd765865b65af68233e64-3104x1072.png?w=1440&auto=format&dpr=2" alt="Stellar.org"/>
  </a>
</p>
<p align="center">
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

**Stellar, Zig3 v3 Airdrop dapp, Next.js 14** web Rewards magic link referral system (inspired by Slack 😎, Notion 📝, and Figma 🎨) built with **Next Auth** and **Soroban**. Styled with **Tremor** components and  **Tailwind CSS**.

</div>

## 🚩 Overview  





**Zi Airdrop Playground**, is a decentralized application (dApp) built with **Next.js 14** fro the new Zig3 v3 Smart wallet, combining features for secure airdrop management with a referral system inspired by modern platforms like Slack, Notion, and Figma. It leverages blockchain technology, WebAuthn for authentication, and a magic link referral system. The project is developer-friendly, responsive, and optimized for deployment on **Vercel**.

#### Key Features
1. **Airdrop Management**: Distribute digital assets to multiple recipients via blockchain smart contracts.
2. **Referral System**: Magic link-based referrals powered by **Supabase**, inspired by collaborative platforms.
3. **WebAuthn Authentication**: Passkey-based secure key encryption (secp256r1 curve) for local device for user authentication; no passwords downlaods no user name. 
4. **Responsive Design**: Optimized for desktop and mobile using **Chakra UI** components.
5. **Blockchain Integration**: Stellar Soroban Smart contract interactions for secure asset transfers, Airdrops, atomic swaps, liquidity pools, staking, sending and receiving.
6. **Analytics**: Integrated **Vercel Analytics** for tracking usage.
7. **Classic Games**: Zig3 v3 Airdrop play ground interoduces classic games like **Space Invades**, and ** Blockchain Tertis** where the user is paid to play.

#### Tech Stack
1. **Frontend**: Next.js 14 (React, TypeScript, server-side rendering)
2. **Backend**: Supabase (serverless functions, database, referral system)
3. **Authentication**: WebAuthn (passkeys)
4. **Styling**: Chakra UI
5. **Blockchain**: Smart contracts for airdrops
6. **Deployment**: Vercel (preview mode, cache invalidation) Supabase (edge function, database)
7. **Tools**: ESLint, Prettier, Vercel Analytics


---


## 🚀 Getting Started 

### ✅ Prerequisites 

- [Node.js 20+](https://nodejs.org/en)  
- [Vercel](https://vercel.com) account
- [SendGrid](https://sendgrid.com/en-us) account 
- [Docker Desktop](https://docs.docker.com/desktop/) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed globally
- [Launchtube](https://github.com/Nathanofzion/launchtube) api keys required
- [Mercury](https://main.mercurydata.app/) api keys required
- [Soroswap](https://github.com/soroswap)  api keys required


### 📂 Installation

The project uses [pnpm](https://pnpm.io/installation) for the package manager therefore you should install pnpm globally (if you haven't already):

   ```bash
   npm install -g pnpm
   ```

2. **Clone Your Fork**: Clone the forked repository to your local machine.

   ```bash
   git clone https://github.com/<your-username>/zi-playground.git
   ```
3. **Install Node modules**.

   ```bash
   pnpm install
   ```


### ⚙️ Configuration & Environment Variables:

   - Add credentials for:
     - **Soroban** (for referral system)
     - **Supabase** (for serverless functions and database)
     - **SendGrid** (for email-based magic links)
     - **Stellar Blockchain keys** (e.g., wallet or contract addresses)

     

### ▶️ Run Development Server
   - **Important**: This project requires Supabase to run locally. First, install the Supabase CLI globally:

   ```bash

  npm install -g supabase
   ```
or
   ```bash

   pnpm add -g supabase
   ```
or for mac users
   ```bash

 brew install supabase/tap/supabase
   ```     

### ▶️ Runing Supabase Locally:
   - **Prerequisites**:
     - Docker Desktop installed and running
     - Supabase CLI installed globally
     - Node.js 16+ installed

   - **Setup Steps**:
     1. Initialize Supabase (if not already done):
        ```bash
        supabase init
        ```
     2. Start Supabase services:
        ```bash
        supabase start
        supabase functions serve --env-file ./supabase/.env.development
        ```
     3. Migrate database leave Start Supabase services running open another terminal (make sure correct node -v is running)
        ```
        supabase db reset
        ```
     4. Synchronize liquidity pair list with router contract
        ```
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

     7. Run command below (pnpm dev) then Open [http://localhost:3000](http://localhost:3000) to view the app.
        ```bash
        pnpm dev
        ```

     8. Stop Supabase services:
        ```bash
        supabase stop
        ```

   - **Trouble Shooting**:
     - If services fail to start, ensure Docker is running
     - Check logs with `supabase logs`
     - Reset local database with `supabase db reset`

#### **Edit and Develop**:
   - Modify `app/page.tsx` for frontend changes (auto-updates in development).
   - Customize smart contracts or backend logic as needed.

---


### 🚢 Deployment 

Check the project can build with no errors

1. **Build Project Locally**.

   ```bash
   pnpm run build
   ```

2. **Preview Project Locally**.

   ```bash
   pnpm preview
   ```
   
- **Vercel** is the recommended platform for deployment:
  1. Push the repository to a Git provider (e.g., GitHub).
  2. Import the project into Vercel.
  3. Configure environment variables in Vercel's dashboard.
  4. Deploy with automatic scaling, preview mode, and serverless functions.
- Refer to [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

### Additional Resources
- **Next.js**: [Docs](https://nextjs.org/docs) | [Tutorial](https://nextjs.org/learn) | [GitHub](https://github.com/vercel/next.js)
- **Supabase**: [Docs](https://supabase.com/docs)
- **WebAuthn**: [Guide](https://webauthn.guide)
- **Chakra UI**: [Docs](https://chakra-ui.com/docs/get-started/installation)
- **Passkeys**: [Docs](https://developers.stellar.org/docs/build/apps/guestbook/setup-passkeys)
- **Soroban**: [Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)

---

### Contributing
- Fork the repository, make changes, and submit a pull request.
- Ensure code adheres to **ESLint** and **Prettier** standards.
Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.


## ⚖️ License  

MIT License - see [LICENSE.md](LICENSE.md) open-source contributions are welcome.

---
