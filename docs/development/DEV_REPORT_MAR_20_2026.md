# Dev Report — March 20, 2026

## Summary
Full session of bug fixes and UI polish across the PasskeyID wallet flow and general app stability.

---

## 1. Fixed: `useSorobanReact` Context Error

**Problem:** `WalletConnectButton` called `useSorobanReact()` at render time, throwing `"useSorobanReact can only be used within the useSorobanReact component"` because the component rendered before the provider was hydrated.

**Fix:** Removed `useSorobanReact` from `WalletConnectButton` entirely. `IWallet.connect()` (from `useWallets.tsx`) already calls `setActiveConnectorAndConnect(connector)` internally — so the hook was never needed. Now passes `activateConnector={wallet?.connect}` directly to `SimpleWalletModal`.

**Files:** `src/components/wallet/WalletConnectButton.tsx`, `src/components/wallet/SimpleWalletModal.tsx`

---

## 2. Fixed: `ChakraProvider` ContextError on App Load

**Problem:** `layout.tsx` (a Next.js Server Component) imported and rendered `<Flex>` from Chakra UI. Chakra components call `useChakraContext()` during render — before `ChakraProvider` (nested inside `AppProvider`) is mounted — causing `"useContext returned undefined. Seems you forgot to wrap component within <ChakraProvider />"`.

**Fix:** Replaced `<Flex h="100vh" direction="column">` with a plain `<div className="app-layout">`. Added `.app-layout { height: 100vh; display: flex; flex-direction: column; }` to `globals.css`.

**Files:** `src/app/layout.tsx`, `src/app/globals.css`

---

## 3. Fixed: Lottie Animation Overlap in PasskeyID Modal

**Problem:** Lottie animation was rendering over the "PasskeyID Wallet Manager" title text because:
- Chakra UI v3 removed the `spacing` prop from `VStack`/`HStack` (replaced by `gap`) — so no spacing was applied
- Lottie SVG was overflowing its container

**Fix:**
- Replaced all `spacing={4}` → `gap={4}` on `VStack` and `HStack spacing={3}` → `gap={3}`
- Added `overflow="hidden"` to the animation `Box` container
- Added `mt={6} mb={4}` for proper separation from close button and title
- Set container to `w="160px" h="213px"` (taller than wide) to show full animation height without clipping

**File:** `src/components/wallet/SimpleWalletModal.tsx`

---

## 4. Updated: PasskeyID Icon in Connect Wallet Button

**Problem:** The PasskeyID wallet button was using a static PNG (`/images/passkey.png`) which didn't match the new Lottie animation identity. Multiple size iterations were tried.

**Final Solution:** Replaced static `<Image>` with a Lottie animation for the PasskeyID wallet only. Container locked to 24×24px (matching all other wallet icons) with `transform: scale(2.2)` and `overflow: hidden` so the animation graphic appears visually prominent while the button layout stays consistent with Freighter/Lobstr buttons.

**File:** `src/components/wallet/WalletConnectButton.tsx`

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Removed Chakra `<Flex>`, replaced with plain `<div className="app-layout">` |
| `src/app/globals.css` | Added `.app-layout` CSS class |
| `src/components/wallet/WalletConnectButton.tsx` | Removed `useSorobanReact`, added Lottie icon for PasskeyID, passes `activateConnector` to modal |
| `src/components/wallet/SimpleWalletModal.tsx` | Fixed `spacing`→`gap`, Lottie container sizing, `activateConnector` prop |
