<div align="center">

# 🚀 Zig3 V3, Stellar, Soroban, Airdrop, Classic Referrel, Staking Next.js 14 Referrel Web Template

[![Stellar.org](https://cdn.sanity.io/images/e2r40yh6/production-i18n/9f868207540ac62ffb2315c85f9d8a545343e036-2997x336.png?w=1440&auto=format&dpr=2)](https://stellar.org/)
[![Zioncoin.org.uk](https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png)](hhttps://zioncoin.org.uk/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-black?style=for-the-badge&logo=nextauth&logoColor=white)](https://next-auth.js.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Tremor](https://img.shields.io/badge/Tremor-FD0061?style=for-the-badge)](https://www.tremor.so)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Stellar, Zig3 v3 Airdrop dapp, Next.js 14** web Rewards magic link referral system (inspired by Slack 😎, Notion 📝, and Figma 🎨) built with **Next Auth** and **Soroban**. Styled with **Tremor** components and  **Tailwind CSS**.

</div>

## 🚩 Overview  





The merged project, **Zi Airdrop Playground**, is a decentralized application (dApp) built with **Next.js 14**, combining features for secure airdrop management with a referral system inspired by modern platforms like Slack, Notion, and Figma. It leverages blockchain technology, WebAuthn for authentication, and a magic link referral system. The project is developer-friendly, responsive, and optimized for deployment on **Vercel**.

#### Key Features
1. **Airdrop Management**: Distribute digital assets to multiple recipients via blockchain smart contracts, through theme changes and classic games.
2. **Referral System**: Magic link-based referrals powered by **NextAuth.js** and **Firebase (Now Soroban Contact)**, inspired by collaborative platforms.
3. **WebAuthn Authentication**: Stellar's passkey protocol leverages the secp256r1 verification curve, Protocol 21, to enable passkey-powered smart wallets, no dapp to download, no passwords required.
4. **Responsive Design**: Optimized for desktop and mobile using **Tailwind CSS** and **Tremor** components.
5. **Blockchain Integration**: Stellar Soroban Smart contract interactions for secure asset transfers, atomic swaps, liquidity pools, sending and receiving .
6. **Analytics**: Integrated **Vercel Analytics** for tracking usage.
7. **Classic Gamez **: Zig3 v3 Airdrop play ground interoduces classic games like **space invades**, and **tertis** where the user is paid to play.

#### Tech Stack
1. **Frontend**: Next.js 14 (React, TypeScript, server-side rendering)
2. **Backend**: Supabase (serverless functions, database), Stellar Soroban smart contracts (referral system)
3. **Authentication**: WebAuthn (passkeys), NextAuth.js (with Firebase adapter)
4. **Styling**: Tailwind CSS, Tremor components
5. **Blockchain**: Stellar Soroban Smart contracts for Sending, recieving, airdroping, swapping, liquidity pools, minting and staking. 
6. **Deployment**: Vercel (serverless, preview mode, cache invalidation)
7. **Tools**: ESLint, Prettier, Vercel Analytics

#### License
- **MIT License** for both original repositories, ensuring open-source contributions are welcome.

---

### Getting Started

#### First, run the development server:
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev 
```

#### **Configure Environment Variables**:
   - Copy `.env.local.example` to `.env.local`.
   - Add credentials for:
     - **Soroban** (for referral system and NextAuth.js adapter)
     - **Supabase** (for serverless functions and database)
     - **SendGrid** (for email-based magic links)
     - Blockchain-related keys (e.g., wallet or contract addresses)

#### **Run Development Server**:
   ```bash
   pnpm dev
   ```
   - Open [http://localhost:3000](http://localhost:3000) to view the app.

#### **Edit and Develop**:
   - Modify `app/page.tsx` for frontend changes (auto-updates in development).
   - Customize smart contracts or backend logic as needed.

---

### Deployment
- **Vercel** is the recommended platform for deployment:
  1. Push the repository to a Git provider (e.g., GitHub).
  2. Import the project into Vercel.
  3. Configure environment variables in Vercel’s dashboard.
  4. Deploy with automatic scaling, preview mode, and serverless functions.
- Refer to [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

### Additional Resources
- **Next.js**: [Docs](https://nextjs.org/docs) | [Tutorial](https://nextjs.org/learn) | [GitHub](https://github.com/vercel/next.js)
- **Supabase**: [Docs](https://supabase.com/docs)
- **WebAuthn**: [Guide](https://webauthn.guide)
- **Passkeys**: [Docs](https://developers.stellar.org/docs/build/apps/guestbook/setup-passkeys)
- **Soroban**: [Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- **Tailwind CSS**: [Docs](https://tailwindcss.com/docs)
- **Tremor**: [Docs](https://www.tremor.so/docs/getting-started/installation)

---

### Contributing
- Fork the repository, make changes, and submit a pull request.
- Ensure code adheres to **ESLint** and **Prettier** standards.
Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
