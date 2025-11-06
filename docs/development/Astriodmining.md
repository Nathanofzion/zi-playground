Zi play ground astroid blast them up mining

### Overview of the Integration Plan
Gamified evolution of the "Play & Earn" mo

AsteroidPatrol3D game (a 3D browser-based asteroid shooter with enemies like UFOs containing aliens) and embed it into the Zi-playground's Airdrops feature. Players will "mine" in-game resources (Gold and Platinum) by blasting asteroids (for base resources) and defeating UFO/alien enemies (for "stealing" higher-value loot).

These resources will convert to $Zi tokens via a mining mechanic inspired by Kale Dapp's farm branch—think staking or yield farming, but triggered by gameplay scores and automated via Stellar Soroban smart contracts. This makes it more engaging than Kale's passive mining: scores act as "proof-of-play" to unlock conversion rates, with bonuses for combos, levels, or referrals.

The end result: A leaderboard like those in Blockchain Tetris and Space Invaders, ranking players by total $Zi earned/mined from sessions. This ties into Zi-playground's existing referral and airdrop system for viral growth—top players get bonus airdrops, and referrals boost conversion multipliers.

Key assumptions based on the repos:
- Zi-playground uses Next.js 14, Chakra UI, Supabase (for DB/referrals), and Stellar Soroban for tokens/airdrops. Games like Tetris/Space Invaders are likely embedded via iframes or React components with Supabase-tracked leaderboards.
- Kale Dapp's farm (mining/staking $Zi or Stellar assets) is passive; we'll gamify it by linking game events to on-chain "mine" transactions.
- AsteroidPatrol3D is pure JS/THREE.js/WebGL—easy to embed as a component, with scoring hooks for blockchain calls.

This is a medium-complexity project (2-3 weeks for a MVP if you're familiar with React/Stellar). I'll outline a step-by-step plan, including tech choices, code sketches, and potential pitfalls.

### High-Level Architecture
- **Frontend**: Embed game in Zi-playground's Airdrops page (e.g., `/airdrops/asteroid-patrol`). Use game scores to trigger $Zi conversions.
- **Backend**: Supabase for leaderboards (real-time scores), Soroban contracts for mining/conversion (inspired by Kale's farm logic).
- **Blockchain**: Stellar for $Zi minting/transfer. Game sessions = "mining epochs" where scores yield Gold/Platinum, convertible to $Zi at rates like 1 Gold = 0.01 $Zi (adjustable for economy).
- **Gamification Twist on Kale**: In Kale, mining is likely time-based staking. Here, it's score-based: Blasting 10 asteroids = 1 Gold; killing a UFO/alien = 5 Platinum. Convert via a "Claim" button that calls a Soroban function, with diminishing returns per session to prevent exploits. Add Kale-like "farm plots" as upgrades (e.g., buy with $Zi for 2x yields).

Visual flow:
1. Player authenticates via Passkey (Zi-playground's WebAuthn).
2. Enters game → Plays → Earns resources.
3. Post-session: Auto-converts to $Zi → Updates leaderboard.
4. Leaderboard shows top miners by total $Zi, with badges for streaks.

### Step-by-Step Implementation Plan

#### Step 1: Set Up Development Environment (1-2 days)
- Fork/clone all repos:
  - Zi-playground: `git clone https://github.com/Nathanofzion/zi-playground.git`
  - AsteroidPatrol3D: `git clone https://github.com/Nathanofzion/AsteroidPatrol3D.git`
  - Kale-site (for mining inspo): `git clone https://github.com/kalepail/kale-site.git` (checkout `farm` branch: `git checkout farm`).
- Install deps in Zi-playground: `pnpm install`.
- Add THREE.js and Howler.js to Zi-playground (for game embedding): `npm install three howler`.
- Test locally: Run Zi-playground (`pnpm run dev`) and embed a simple THREE.js scene to verify WebGL works.
- Study Kale's farm: Since details are sparse, reverse-engineer key files like any `/contracts/` or `/utils/mining.js` for staking logic (e.g., time-locked yields). Adapt to score-based triggers.

**Pitfall**: Ensure browser compatibility—game works on Chrome/Firefox; test mobile touch controls.

#### Step 2: Embed the Asteroid Game into Zi-Playground (2-3 days)
- Create a new page/component in Zi-playground: `app/airdrops/asteroid-patrol/page.tsx`.
- Port AsteroidPatrol3D:
  - Copy core files (`AsteroidPatrol3D.html` → React component; `js/` folder into `/components/game/`).
  - Wrap in a React hook for state management (use `useEffect` for THREE.js init).
  - Example skeleton (in `AsteroidGame.tsx`):

    ```tsx
    // components/game/AsteroidGame.tsx
    import { useEffect, useRef, useState } from 'react';
    import * as THREE from 'three';
    // Import game logic from AsteroidPatrol3D (e.g., controls, UFO, asteroids)
    // Assume you've ported: initScene, updateLoop, scoreHandler

    export default function AsteroidGame({ onScoreUpdate }: { onScoreUpdate: (score: number, resources: { gold: number; platinum: number }) => void }) {
      const mountRef = useRef<HTMLDivElement>(null);
      const [gameOver, setGameOver] = useState(false);
      const [resources, setResources] = useState({ gold: 0, platinum: 0 });

      useEffect(() => {
        if (!mountRef.current) return;
        const scene = initScene(mountRef.current); // Ported from original: setup camera, lights, arena
        const animate = () => {
          requestAnimationFrame(animate);
          updateLoop(scene); // Handle asteroids, UFO/alien shooting, collisions
          // Custom hooks: On asteroid destroy → +gold; On UFO kill → +platinum + "steal" animation
          if (/* asteroid hit */) { resources.gold += 1; setResources(resources); }
          if (/* UFO killed */) { resources.platinum += 5; setResources(resources); onScoreUpdate(resources.gold * 20 + resources.platinum * 100, resources); }
          renderer.render(scene, camera);
        };
        animate();
        return () => { /* cleanup */ };
      }, []);

      const handleGameOver = () => {
        setGameOver(true);
        onScoreUpdate(resources.gold * 20 + resources.platinum * 100, resources); // Trigger mining conversion
      };

      return (
        <div ref={mountRef} style={{ width: '100%', height: '600px' }}>
          {!gameOver ? (
            // HUD: Score, Resources, Radar (port from original)
            <div className="hud">Gold: {resources.gold} | Platinum: {resources.platinum}</div>
          ) : (
            <button onClick={() => window.location.reload()}>Retry</button>
          )}
        </div>
      );
    }
    ```

- Integrate into Airdrops page: Use Chakra UI for layout, add Passkey auth check.
- Gamify mining: Add visuals like particle effects for "mining blasts" (e.g., gold coins exploding from asteroids using THREE.js).

**Pitfall**: Porting THREE.js to React—use `@react-three/fiber` if you want declarative syntax (install: `npm i @react-three/fiber @react-three/drei`).

#### Step 3: Implement Mining Mechanics (Inspired by Kale) (3-5 days)
- Adapt Kale's farm logic: Assume it's a Soroban contract for staking $Zi/Stellar assets. Extend to a new "GameMine" contract.
- Resource Conversion:
  - Gold/Platinum as in-game scores → Call Soroban tx to "mine" $Zi.
  - Rate: Base 1 Gold = 0.01 $Zi; Platinum = 0.007 $Zi. Gamify: +20% for alien kills ( "stealing" bonus); referral multiplier from Zi-playground.
  - Use Stellar SDK: In game component, on session end:

    ```tsx
    // utils/mining.ts (adapt from Kale)
    import { Server, Contract, xdr } from 'soroban-client'; // Stellar SDK

    async function convertToZi(userAddress: string, gold: number, platinum: number, sessionId: string) {
      const server = new Server('https://horizon-testnet.stellar.org'); // Or mainnet
      const contract = new Contract('YOUR_GAME_MINE_CONTRACT_ID'); // Deploy new Soroban contract
      const tx = await server.simulateTransaction({
        // Invoke 'mine' function: input scores as u64, output $Zi amount
        method: 'mine',
        args: [xdr.ScVal.scvU64(gold), xdr.ScVal.scvU64(platinum), xdr.ScVal.scvString(sessionId)],
      });
      // Sign with Passkey-derived keypair (from Zi-playground's WebAuthn)
      const signedTx = await signWithPasskey(tx); // Custom func
      await server.submitTransaction(signedTx);
      return tx.results[0].xdr().switch().name === 'void'; // Success
    }
    ```

- Deploy Soroban contract: Use Rust (Soroban SDK) to write `lib.rs` with `mine` fn (input: scores → output: $Zi transfer to user). Test on Futurenet.
- Kale Twist: Add "farm upgrades" – spend $Zi to buy persistent buffs (e.g., 10% yield boost), stored in Supabase.

**Pitfall**: Gas fees—batch conversions per session. Balance economy to avoid inflation (cap daily mines).

#### Step 4: Add Leaderboard Like Tetris/Space Invaders (2-3 days)
- Use Supabase (already in Zi-playground) for real-time DB.
- Schema: Table `asteroid_leaderboard` with columns: `user_id`, `total_zi_mined`, `sessions_played`, `rank`, `last_session`.
- Post-conversion: Upsert score via Supabase JS client.
- Component: Reusable `<Leaderboard />` (Chakra Table, sorted by `total_zi_mined DESC`).

  ```tsx
  // components/Leaderboard.tsx
  import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
  import { useEffect, useState } from 'react';

  export default function Leaderboard({ game: 'asteroid' }) {
    const supabase = useSupabaseClient();
    const session = useSession();
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
      const fetchLeaderboard = async () => {
        const { data } = await supabase
          .from('asteroid_leaderboard')
          .select('*')
          .order('total_zi_mined', { ascending: false })
          .limit(50);
        setLeaderboard(data || []);
      };
      fetchLeaderboard();
      // Realtime subscription
      const sub = supabase.channel('leaderboard').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asteroid_leaderboard' }, fetchLeaderboard).subscribe();
      return () => sub.unsubscribe();
    }, []);

    return (
      <Table variant="simple">
        <Thead><Tr><Th>Rank</Th><Th>Player</Th><Th>$Zi Mined</Th></Tr></Thead>
        <Tbody>
          {leaderboard.map((entry, i) => (
            <Tr key={entry.user_id}><Td>{i+1}</Td><Td>{entry.username}</Td><Td>{entry.total_zi_mined}</Td></Tr>
          ))}
        </Tbody>
      </Table>
    );
  }
  ```

- Integrate: Show on Airdrops page sidebar. Award airdrops to top 10 (e.g., via cron job calling Soroban).

**Pitfall**: Privacy—anon user_ids via Passkeys. Prevent spam with session cooldowns.

#### Step 5: Testing, Polish, and Deployment (3-5 days)
- Test: Local end-to-end (play game → convert → leaderboard update). Use Stellar testnet for txs.
- Polish: Add animations (e.g., confetti on high scores via `react-confetti`), mobile optimizations, sound toggles.
- Security: Audit Passkey signing; rate-limit conversions.
- Deploy: Vercel for frontend (auto from GitHub). Update Supabase env vars. Announce via Zi-playground's referral system.
- Metrics: Track via Vercel Analytics (sessions, $Zi volume).

