The merged project, **Zi Airdrop Playground**, is a decentralized application (dApp) built with **Next.js 14**, combining features for secure airdrop management with a referral system inspired by modern platforms like Slack, Notion, and Figma. It leverages blockchain technology, WebAuthn for authentication, and a magic link referral system. The project is developer-friendly, responsive, and optimized for deployment on **Vercel**.

#### Key Features
1. **Airdrop Management**: Distribute digital assets to multiple recipients via blockchain smart contracts.
2. **Referral System**: Magic link-based referrals powered by **Supabase**, inspired by collaborative platforms.
3. **WebAuthn Authentication**: Passkey-based secure user authentication.
4. **Responsive Design**: Optimized for desktop and mobile using **Chakra UI** components.
5. **Blockchain Integration**: Stellar Soroban Smart contract interactions for secure asset transfers, atomic swaps, liquidity pools, sending and receiving.
6. **Analytics**: Integrated **Vercel Analytics** for tracking usage.

#### Tech Stack
1. **Frontend**: Next.js 14 (React, TypeScript, server-side rendering)
2. **Backend**: Supabase (serverless functions, database, referral system)
3. **Authentication**: WebAuthn (passkeys)
4. **Styling**: Chakra UI
5. **Blockchain**: Smart contracts for airdrops
6. **Deployment**: Vercel (preview mode, cache invalidation) Supabase (edge function, database)
7. **Tools**: ESLint, Prettier, Vercel Analytics

#### License
- **MIT License** for both original repositories, ensuring open-source contributions are welcome.

---

### Getting Started

#### **Configure Environment Variables**:
   - Copy `.env.development` to `.env.local`.
   - Copy `supabase/.env.development` to `supabase/.env.local`.
   - Add credentials for:
     - **Supabase** (for serverless functions and database)
     - **SendGrid** (for email-based magic links)
     - Blockchain-related keys (e.g., wallet or contract addresses, if applicable)

#### **Run Development Server**:
   - **Important**: This project requires Supabase to run locally. First, install the Supabase CLI globally (`npm install -g supabase` or `pnpm add -g supabase`), then run:

   ```bash
   supabase start
   supabase functions serve --env-file ./supabase/.env.local
   ```

   ```bash
   pnpm dev
   ```
   - Open [http://localhost:3000](http://localhost:3000) to view the app.

#### **Running Supabase Locally**:
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
        ```
        This will start all required services including:
        - PostgreSQL database
        - Supabase Auth
        - Storage
        - Edge Functions
        - Studio (web interface)

     3. Access Supabase Studio:
        - Open [http://localhost:54323](http://localhost:54323)
        - Default credentials:
          - Email: `supabase`
          - Password: `supabase`

     4. Database Management:
        - Use Studio to manage your database schema
        - Create tables, policies, and functions
        - Monitor database performance

     5. Stop Supabase services:
        ```bash
        supabase stop
        ```

   - **Troubleshooting**:
     - If services fail to start, ensure Docker is running
     - Check logs with `supabase logs`
     - Reset local database with `supabase db reset`

#### **Edit and Develop**:
   - Modify `app/page.tsx` for frontend changes (auto-updates in development).
   - Customize smart contracts or backend logic as needed.

---

### Deployment
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

---

### Contributing
- Fork the repository, make changes, and submit a pull request.
- Ensure code adheres to **ESLint** and **Prettier** standards.
Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
