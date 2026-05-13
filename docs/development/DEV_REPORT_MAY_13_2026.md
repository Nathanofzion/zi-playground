# Dev Report — May 13, 2026

## Summary
First successful Vercel production deployment in 18 days. Four bugs fixed across the home page, Space Invaders mini-game, and particle background. A fifth bug (3D Space Invaders camera) was discovered post-deploy and resolved in the same session.

---

## Root Cause Discovery: Stale Deployment (18 Days)

**Problem:** All commits from the past 18 days were never reaching production. The site was serving an 18-day-old build.

**Root Cause:** GitHub auto-deploy was disconnected from Vercel. Every commit pushed to `origin/main` was silently ignored by Vercel — no CI/CD pipeline was active.

**Fix:** Deployed manually via Vercel CLI (`vercel --prod --yes`). All subsequent deploys use the same method.

**Note:** GitHub auto-deploy remains disconnected. All production deploys must be triggered manually with `vercel --prod --yes` from the project root.

---

## 1. Fixed: BgParticles TypeScript Build Error (Deployment Blocker)

**Problem:** `pnpm build` failed with:
```
Type error: Type '{ ... }' is not assignable to type 'RecursivePartial<IOptions>'.
  The types of 'particles.move.direction' are incompatible between these types.
    Type 'string' is not assignable to type '... MoveDirection ...'
```
`MoveDirection` and `RotateDirection` in `tsparticles-engine` are `const enum` — TypeScript cannot narrow string literals to the enum without explicit `as const` assertions. The values exported at runtime are `{}` (empty objects), confirming they are erased at compile time.

**Fix:** Added `as const` to all direction literals in the particle options object inside `useMemo`:
- `direction: "none" as const`
- `default: "bounce" as const`  
- `direction: "clockwise" as const`

**Commit:** `94d433f`  
**Files:** `src/components/common/BgParticles.tsx`

---

## 2. Fixed: Space Invaders Stuck on LOADING Screen

**Problem:** The Space Invaders game would show "LOADING..." indefinitely on mount (or after navigating away and back).

**Root Causes (two):**
1. **State singleton not reset on remount:** `State.state` was left as `"GAMEOVER"` or other non-TITLESCREEN value from a previous session. On remount, the render loop entered `"GAMEOVER"` immediately and called `createScore()`, which was broken, causing the loop to stall.
2. **GameAssetsManager model load failures:** GLB model fetches had no `.catch()` handlers. A single failed model load meant `isComplete` never became `true`, permanently blocking the render loop (which gated all game logic behind `if (gameAssets.isComplete)`).

**Fix:**
- Reset `State.state = "TITLESCREEN"` and `State.gameOverStep = 0` at the top of the `useEffect`.
- Added `.catch()` handlers to all 5 `loadModel()` calls in `GameAssetsManager.js` — failures increment the load counter so `isComplete` resolves regardless.

**Commit:** `228ce98`  
**Files:** `src/components/common/space-invaders/index.tsx`, `src/components/common/space-invaders/GameAssetsManager.js`

---

## 3. Fixed: zig3 3D Cube Missing on Home Page

**Problem:** The zig3 glass cube (and sometimes the Earth globe) failed to appear on the home page. The entire 3D viewer was often replaced by the fallback div.

**Root Causes (two):**
1. **HDRI inside same Suspense as Earth/cube:** `<Environment files="...dancing_hall_1k.hdr">` was inside the same `<Suspense fallback={null}>` as the Earth and cube. While the HDRI loaded (~5s), React suspended the entire subtree — nothing rendered.
2. **WebGL error handler too broad:** The error filter matched `message.includes('context')` and `message.includes('canvas')`. Many unrelated errors contain these words, causing `setHasWebGLError(true)` to fire and permanently replace the 3D viewer with a fallback div.

**Fix:**
- Moved `<Environment>` into its own `<Suspense fallback={null}>` wrapped in `<HDRIErrorBoundary>`, separate from the Earth/cube Suspense. Earth and cube now render immediately while HDRI loads independently.
- Tightened WebGL error filter to only match: `"WebGLRenderer"`, `"WebGL context"`, `"CONTEXT_LOST_WEBGL"`.

**Commit:** `228ce98`  
**Files:** `src/components/Earth.tsx`

---

## 4. Fixed: Jerky Particle Animation

**Problem:** Particle background (`BgParticles`) caused visible jank/stutter. The tsparticles options object was recreated on every render, triggering unnecessary re-initialisation of the particle engine.

**Fix:**
- Wrapped the options object in `useMemo` so it is only created once.
- Reduced `fpsLimit` from 120 to 60 to cap CPU usage.

**Commit:** `05e0874`  
**Files:** `src/components/common/BgParticles.tsx`

---

## 5. Fixed: "Action cam 3D" Mode Shows 2D View

**Problem:** Selecting "Action cam 3D" (mode 2) in the Space Invaders mode selector played the game in the same orthographic 2D camera as Traditional 2D. The 3D perspective camera was never activated.

**Root Cause:** `parseSelectedMode()` was called *after* `new Environment(engine)` in the `useEffect`. The `Environment` constructor calls `CreateCamera()` which reads `spaceinvadersConfig.actionCam` immediately to decide between a perspective (3D) and orthographic (2D) camera. By the time `parseSelectedMode()` ran and set `actionCam = true`, the camera was already created as 2D.

A secondary issue: `spaceinvadersConfig` is a module-level singleton. `actionCam` and `oldSchoolEffects.enabled` retained their values from a previous mount, meaning switching modes between sessions could produce incorrect behaviour.

**Fix:**
1. Reset config singleton values (`actionCam = false`, `oldSchoolEffects.enabled = false`) at the top of `useEffect`, before any game objects are created.
2. Call `parseSelectedMode()` before `new Environment(engine)` so the correct camera type is set when `CreateCamera()` runs.
3. Removed the duplicate (now-redundant) `parseSelectedMode()` call that was placed after `engine.runRenderLoop()`.

**Commit:** `b6a8a97`  
**Files:** `src/components/common/space-invaders/index.tsx`

---

## 6. Updated: CSP Headers in vercel.json

**Problem:** Content Security Policy blocked required external resources: Google Fonts, Poly Haven HDRI files, Draco WASM decoder, and blob URLs needed for Web Workers.

**Fix:** Extended `connect-src` and `worker-src` directives in `vercel.json` to include:
- `https://fonts.googleapis.com`
- `https://dl.polyhaven.org`
- `https://www.gstatic.com`
- `blob:`

**Commit:** `7696abb`  
**Files:** `vercel.json`

---

## Known Outstanding Issues

| Issue | File | Severity | Notes |
|-------|------|----------|-------|
| `document.querySelector('canvas')` in Environment.js | `src/components/common/space-invaders/Environment.js:11` | Low | Grabs first canvas on page via DOM query instead of `engine.getRenderingCanvas()`. Non-blocking while R3F and BabylonJS never render simultaneously. |
| GitHub auto-deploy disconnected | Vercel dashboard | Medium | All production deploys must be triggered manually: `vercel --prod --yes` |

---

## Deployment History (This Session)

| Commit | Description | Build |
|--------|-------------|-------|
| `7696abb` | CSP headers | ✅ |
| `05e0874` | Particle memoization + fps | ✅ |
| `228ce98` | Earth/cube Suspense, WebGL filter, GameAssets guards | ✅ |
| `94d433f` | BgParticles `as const` TypeScript fix | ✅ → First successful production deploy |
| `b6a8a97` | Space Invaders 3D camera fix | ✅ |

**Production URL:** `zi-playground.vercel.app`
