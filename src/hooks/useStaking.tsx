import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import * as StellarSdk from "@stellar/stellar-sdk";

import stakingContract from "@/constants/stakingContract";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StakerPosition {
  /** LP tokens currently staked (in stroops) */
  staked: BigNumber;
  /** Unix timestamp (seconds) when the lock expires */
  unlockTime: number;
  /** Zi rewards pending claim (in stroops) */
  pendingRewards: BigNumber;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Encode a decimal string amount (e.g. "10.5") as an i128 ScVal in stroops */
function i128ScVal(decimalAmount: string, decimals = 7): StellarSdk.xdr.ScVal {
  const stroops = new BigNumber(decimalAmount)
    .shiftedBy(decimals)
    .integerValue(BigNumber.ROUND_DOWN);

  const base = new BigNumber(2).pow(64);
  const lo = stroops.modulo(base);
  const hi = stroops.minus(lo).dividedBy(base);

  return StellarSdk.xdr.ScVal.scvI128(
    new StellarSdk.xdr.Int128Parts({
      hi: StellarSdk.xdr.Int64.fromString(hi.toFixed(0)),
      lo: StellarSdk.xdr.Uint64.fromString(lo.toFixed(0)),
    })
  );
}

/** Encode a Stellar address as an Address ScVal */
function addressScVal(addr: string): StellarSdk.xdr.ScVal {
  return StellarSdk.Address.fromString(addr).toScVal();
}

/** Parse an i128 ScVal result to a BigNumber */
function parseI128(scVal: any): BigNumber {
  try {
    if (scVal?.i128) {
      const lo = new BigNumber(scVal.i128.lo?.toString() ?? "0");
      const hi = new BigNumber(scVal.i128.hi?.toString() ?? "0");
      return hi.multipliedBy(new BigNumber(2).pow(64)).plus(lo);
    }
    if (typeof scVal === "bigint" || typeof scVal === "number") {
      return new BigNumber(scVal.toString());
    }
    return new BigNumber(scVal?.toString() ?? "0");
  } catch {
    return new BigNumber(0);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export default function useStaking() {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const [position, setPosition] = useState<StakerPosition | null>(null);
  const [totalStaked, setTotalStaked] = useState<BigNumber>(new BigNumber(0));
  const [rewardRate, setRewardRate] = useState<BigNumber>(new BigNumber(0));
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const contractAddress = stakingContract.address;
  const isConfigured = !!contractAddress;

  // ── Read: fetch staker position ─────────────────────────────────────────

  const fetchPosition = useCallback(async () => {
    if (!address || !isConfigured) return;
    setIsLoadingPosition(true);
    try {
      const result = await contractInvoke({
        contractAddress,
        method: "staker_info",
        args: [addressScVal(address)],
        signAndSend: false,
        sorobanContext,
      });

      if (result && Array.isArray(result)) {
        const [staked, unlockTime, pending] = result;
        setPosition({
          staked: parseI128(staked),
          unlockTime: Number(unlockTime ?? 0),
          pendingRewards: parseI128(pending),
        });
      }
    } catch (err) {
      console.error("useStaking: fetchPosition error", err);
    } finally {
      setIsLoadingPosition(false);
    }
  }, [address, contractAddress, sorobanContext, isConfigured]);

  // ── Read: fetch global stats ─────────────────────────────────────────────

  const fetchGlobalStats = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const [totalResult, rateResult] = await Promise.all([
        contractInvoke({
          contractAddress,
          method: "total_staked",
          args: [],
          signAndSend: false,
          sorobanContext,
        }),
        contractInvoke({
          contractAddress,
          method: "reward_rate",
          args: [],
          signAndSend: false,
          sorobanContext,
        }),
      ]);
      setTotalStaked(parseI128(totalResult));
      setRewardRate(parseI128(rateResult));
    } catch (err) {
      console.error("useStaking: fetchGlobalStats error", err);
    }
  }, [contractAddress, sorobanContext, isConfigured]);

  useEffect(() => {
    fetchPosition();
    fetchGlobalStats();
  }, [fetchPosition, fetchGlobalStats]);

  // ── Write: stake LP tokens ────────────────────────────────────────────────

  const stake = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      if (!isConfigured) throw new Error("Staking contract not yet deployed");
      setIsStaking(true);
      try {
        await contractInvoke({
          contractAddress,
          method: "stake",
          args: [addressScVal(address), i128ScVal(amount)],
          signAndSend: true,
          sorobanContext,
        });
        await fetchPosition();
        await fetchGlobalStats();
      } finally {
        setIsStaking(false);
      }
    },
    [address, contractAddress, sorobanContext, fetchPosition, fetchGlobalStats, isConfigured]
  );

  // ── Write: unstake + auto-claim ───────────────────────────────────────────

  const unstake = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!isConfigured) throw new Error("Staking contract not yet deployed");
    setIsUnstaking(true);
    try {
      await contractInvoke({
        contractAddress,
        method: "unstake",
        args: [addressScVal(address)],
        signAndSend: true,
        sorobanContext,
      });
      await fetchPosition();
      await fetchGlobalStats();
    } finally {
      setIsUnstaking(false);
    }
  }, [address, contractAddress, sorobanContext, fetchPosition, fetchGlobalStats, isConfigured]);

  // ── Write: claim rewards only ─────────────────────────────────────────────

  const claim = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!isConfigured) throw new Error("Staking contract not yet deployed");
    setIsClaiming(true);
    try {
      await contractInvoke({
        contractAddress,
        method: "claim",
        args: [addressScVal(address)],
        signAndSend: true,
        sorobanContext,
      });
      await fetchPosition();
    } finally {
      setIsClaiming(false);
    }
  }, [address, contractAddress, sorobanContext, fetchPosition, isConfigured]);

  // ── Write: fund reward pool (open to anyone) ──────────────────────────────

  const fundRewards = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      if (!isConfigured) throw new Error("Staking contract not yet deployed");
      setIsFunding(true);
      try {
        await contractInvoke({
          contractAddress,
          method: "fund_rewards",
          args: [addressScVal(address), i128ScVal(amount)],
          signAndSend: true,
          sorobanContext,
        });
        await fetchGlobalStats();
      } finally {
        setIsFunding(false);
      }
    },
    [address, contractAddress, sorobanContext, fetchGlobalStats, isConfigured]
  );

  return {
    position,
    totalStaked,
    rewardRate,
    isLoadingPosition,
    isStaking,
    isUnstaking,
    isClaiming,
    isFunding,
    isConfigured,
    stake,
    unstake,
    claim,
    fundRewards,
    refetch: () => { fetchPosition(); fetchGlobalStats(); },
  };
}
