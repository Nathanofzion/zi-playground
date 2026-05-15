#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test.sh — Run unit tests for the Zi LP Staking contract
#
# Usage:
#   chmod +x test.sh
#   ./test.sh
#
# Run a specific test:
#   ./test.sh test_fund_then_stake_then_claim
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TEST_FILTER="${1:-}"

echo "═══════════════════════════════════════════════════════"
echo " Zi LP Staking Contract — Unit Tests"
echo "═══════════════════════════════════════════════════════"
echo ""

if [[ -n "$TEST_FILTER" ]]; then
  echo "▸ Running test: $TEST_FILTER"
  cargo test --features testutils -- "$TEST_FILTER" --nocapture
else
  echo "▸ Running all tests..."
  cargo test --features testutils -- --nocapture
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo " All tests passed ✓"
echo "═══════════════════════════════════════════════════════"
