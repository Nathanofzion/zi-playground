#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Build and deploy the Zi LP Staking contract to Stellar testnet
#
# Prerequisites:
#   stellar CLI >= 21.0.0   (brew install stellar-cli)
#   Rust + wasm32 target    (rustup target add wasm32-unknown-unknown)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Environment variables (optional overrides):
#   ADMIN_IDENTITY   — stellar CLI identity name for the admin (default: zi-admin)
#   NETWORK          — stellar network alias (default: testnet)
#   ZI_TOKEN_ADDRESS — Zi SAC contract address on the target network
#   LP_TOKEN_ADDRESS — LP token contract address on the target network
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ADMIN_IDENTITY="${ADMIN_IDENTITY:-zi-admin}"
NETWORK="${NETWORK:-testnet}"

# Zi token on Stellar mainnet:
#   Asset:  Zi-GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7-1
# To get the SAC address on testnet, run:
#   stellar contract id asset --asset "Zi:GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7" --network testnet
ZI_TOKEN_ADDRESS="${ZI_TOKEN_ADDRESS:-}"
LP_TOKEN_ADDRESS="${LP_TOKEN_ADDRESS:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "═══════════════════════════════════════════════════════"
echo " Zi LP Staking Contract — Build & Deploy"
echo " Network  : $NETWORK"
echo " Admin    : $ADMIN_IDENTITY"
echo "═══════════════════════════════════════════════════════"

# ── 1. Build WASM ────────────────────────────────────────────────────────────
echo ""
echo "▸ Building contract (release)..."
# On testnet: 12-hour lock period represents 1 year for demo/testing.
# On mainnet: full 1-year lock (default, no extra feature flag needed).
if [[ "$NETWORK" == "testnet" || "$NETWORK" == "futurenet" ]]; then
  echo "  [testnet] Using testnet-time feature: lock = 12 hours"
  stellar contract build -- --features testnet-time
else
  stellar contract build
fi

WASM="target/wasm32-unknown-unknown/release/zi_lp_staking.wasm"
if [[ ! -f "$WASM" ]]; then
  echo "ERROR: WASM not found at $WASM"
  exit 1
fi
echo "  ✓ Built: $WASM"

# ── 2. Optimise WASM (optional, requires wasm-opt) ──────────────────────────
if command -v wasm-opt &>/dev/null; then
  echo ""
  echo "▸ Optimising WASM..."
  wasm-opt -Oz --enable-bulk-memory "$WASM" -o "$WASM"
  echo "  ✓ Optimised"
fi

# ── 3. Ensure admin identity exists ─────────────────────────────────────────
echo ""
echo "▸ Checking identity '$ADMIN_IDENTITY'..."
if ! stellar keys show "$ADMIN_IDENTITY" &>/dev/null; then
  echo "  Identity not found — generating..."
  stellar keys generate "$ADMIN_IDENTITY" --network "$NETWORK"
fi
ADMIN_ADDRESS=$(stellar keys address "$ADMIN_IDENTITY")
echo "  Admin address: $ADMIN_ADDRESS"

# ── 4. Fund account on testnet (skip on mainnet) ─────────────────────────────
if [[ "$NETWORK" == "testnet" || "$NETWORK" == "futurenet" ]]; then
  echo ""
  echo "▸ Funding admin account via Friendbot..."
  stellar keys fund "$ADMIN_IDENTITY" --network "$NETWORK" || true
fi

# ── 5. Resolve Zi SAC address if not provided ────────────────────────────────
if [[ -z "$ZI_TOKEN_ADDRESS" ]]; then
  echo ""
  echo "▸ Resolving Zi SAC address..."
  ZI_TOKEN_ADDRESS=$(
    stellar contract id asset \
      --asset "Zi:GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7" \
      --network "$NETWORK" 2>/dev/null || echo ""
  )
  if [[ -z "$ZI_TOKEN_ADDRESS" ]]; then
    echo "  WARNING: Could not auto-resolve Zi SAC address."
    echo "  Set ZI_TOKEN_ADDRESS manually and re-run."
    echo "  Example (testnet):"
    echo "    stellar contract id asset --asset 'Zi:GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7' --network testnet"
    exit 1
  fi
fi
echo "  Zi token : $ZI_TOKEN_ADDRESS"

# ── 6. LP token must be provided ────────────────────────────────────────────
if [[ -z "$LP_TOKEN_ADDRESS" ]]; then
  echo ""
  echo "ERROR: LP_TOKEN_ADDRESS is not set."
  echo "  Provide the Soroswap (or other DEX) Zi/XLM LP token contract address."
  echo "  Example:"
  echo "    export LP_TOKEN_ADDRESS=<contract-address>"
  echo "    ./deploy.sh"
  exit 1
fi
echo "  LP token : $LP_TOKEN_ADDRESS"

# ── 7. Deploy contract ───────────────────────────────────────────────────────
echo ""
echo "▸ Deploying contract..."
CONTRACT_ID=$(
  stellar contract deploy \
    --wasm "$WASM" \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK"
)
echo "  ✓ Contract deployed: $CONTRACT_ID"

# ── 8. Initialise contract ───────────────────────────────────────────────────
echo ""
echo "▸ Initialising contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$ADMIN_IDENTITY" \
  --network "$NETWORK" \
  -- init \
  --admin "$ADMIN_ADDRESS" \
  --reward_token "$ZI_TOKEN_ADDRESS" \
  --lp_token "$LP_TOKEN_ADDRESS"

echo "  ✓ Contract initialised"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Deployment complete!"
echo ""
echo "  Contract ID : $CONTRACT_ID"
echo "  Admin       : $ADMIN_ADDRESS"
echo "  Reward token: $ZI_TOKEN_ADDRESS"
echo "  LP token    : $LP_TOKEN_ADDRESS"
echo "  Network     : $NETWORK"
echo ""
echo " Next step — fund the reward pool (anyone can do this):"
echo ""
echo "  stellar contract invoke \\"
echo "    --id $CONTRACT_ID \\"
echo "    --source <funder-identity> \\"
echo "    --network $NETWORK \\"
echo "    -- fund_rewards \\"
echo "    --funder <funder-address> \\"
echo "    --amount <zi-stroops>"
echo ""
echo "  10% APR on 1000 LP tokens ≈ deposit 100 LP-equivalent Zi per year."
echo "═══════════════════════════════════════════════════════"
