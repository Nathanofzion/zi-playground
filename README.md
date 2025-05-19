The merged project, **Zi Airdrop Playground**, is a decentralized application (dApp) built with **Next.js 14**, combining features for secure airdrop management with a referral system inspired by modern platforms like Slack, Notion, and Figma. It leverages blockchain technology, WebAuthn for authentication, and a magic link referral system. The project is developer-friendly, responsive, and optimized for deployment on **Vercel**.

#### Key Features
1. **Airdrop Management**: Distribute digital assets to multiple recipients via blockchain smart contracts.
2. **Referral System**: Magic link-based referrals powered by **NextAuth.js** and **Firebase (Now Soroban Contact)**, inspired by collaborative platforms.
3. **WebAuthn Authentication**: Passkey-based secure user authentication.
4. **Responsive Design**: Optimized for desktop and mobile using **Tailwind CSS** and **Tremor** components.
5. **Blockchain Integration**: Stellar Soroban Smart contract interactions for secure asset transfers, atomic swaps, liquidity pools, sending and receiving .
6. **Analytics**: Integrated **Vercel Analytics** for tracking usage.

#### Tech Stack
1. **Frontend**: Next.js 14 (React, TypeScript, server-side rendering)
2. **Backend**: Supabase (serverless functions, database), Firebase (referral system)
3. **Authentication**: WebAuthn (passkeys), NextAuth.js (with Firebase adapter)
4. **Styling**: Tailwind CSS, Tremor components
5. **Blockchain**: Smart contracts for airdrops
6. **Deployment**: Vercel (serverless, preview mode, cache invalidation)
7. **Tools**: ESLint, Prettier, Vercel Analytics

#### License
- **MIT License** for both original repositories, ensuring open-source contributions are welcome.

---

### Getting Started

#### **Configure Environment Variables**:
   - Copy `.env.development` to `.env.local`.
   - Copy `supabase/.env.development` to `supabase/.env.local`.
   - Add credentials for:
     - **Firebase** (for referral system and NextAuth.js adapter)
     - **Supabase** (for serverless functions and database)
     - **SendGrid** (for email-based magic links)
     - Blockchain-related keys (e.g., wallet or contract addresses, if applicable)

#### **Run Development Server**:
   ```bash
   supabase start
   supabase functions serve --env-file ./supabase/.env.local
   ```

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
- **Firebase**: [Docs](https://firebase.google.com/docs)
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
