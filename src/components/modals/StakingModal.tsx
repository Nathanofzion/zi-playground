"use client";
import BigNumber from "bignumber.js";
import { FC, useMemo, useState } from "react";

import {
  Badge,
  Flex,
  Heading,
  Spinner,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import stakingContract from "@/constants/stakingContract";
import useStaking from "@/hooks/useStaking";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ZI_DECIMALS = 7;

function fromStroops(stroops: BigNumber, decimals = ZI_DECIMALS): string {
  return stroops.shiftedBy(-decimals).toFormat(4);
}

function formatCountdown(unlockTimeSecs: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = unlockTimeSecs - now;
  if (diff <= 0) return "Unlocked";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h remaining`;
  }
  return `${h}h ${m}m ${s}s remaining`;
}

// ── Stat row ─────────────────────────────────────────────────────────────────

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Flex
    justify="space-between"
    align="center"
    px={4}
    py={2}
    rounded="xl"
    bg="rgba(255,255,255,0.08)"
  >
    <Text fontSize="sm" opacity={0.7}>
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="bold">
      {value}
    </Text>
  </Flex>
);

// ── Main modal ────────────────────────────────────────────────────────────────

const StakingModal: FC<ModalProps> = (props) => {
  const { address } = useSorobanReact();
  const {
    position,
    totalStaked,
    isLoadingPosition,
    isStaking,
    isUnstaking,
    isClaiming,
    isConfigured,
    stake,
    unstake,
    claim,
  } = useStaking();

  const [stakeAmount, setStakeAmount] = useState("");

  const isLocked = useMemo(() => {
    if (!position || position.unlockTime === 0) return false;
    return Math.floor(Date.now() / 1000) < position.unlockTime;
  }, [position]);

  const hasStake = position && position.staked.gt(0);
  const hasPending = position && position.pendingRewards.gt(0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStake = async () => {
    if (!address) {
      toaster.create({ title: "Connect your wallet first", type: "warning" });
      return;
    }
    if (!stakeAmount || new BigNumber(stakeAmount).lte(0)) {
      toaster.create({ title: "Enter an amount to stake", type: "warning" });
      return;
    }
    try {
      await stake(stakeAmount);
      setStakeAmount("");
      toaster.create({ title: "LP tokens staked!", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toaster.create({ title: msg, type: "error" });
    }
  };

  const handleUnstake = async () => {
    try {
      await unstake();
      toaster.create({
        title: "LP tokens unstaked & rewards claimed!",
        type: "success",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toaster.create({ title: msg, type: "error" });
    }
  };

  const handleClaim = async () => {
    try {
      await claim();
      toaster.create({ title: "Zi rewards claimed!", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toaster.create({ title: msg, type: "error" });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "440px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />

        {/* Header */}
        <Flex direction="column" align="center" gap={2}>
          <Heading as="h2" textAlign="center" size="lg">
            STAKING
          </Heading>
          <Badge
            px={3}
            py={1}
            rounded="full"
            fontSize="xs"
            colorScheme="purple"
            bg="rgba(165,136,228,0.25)"
            color="inherit"
            border="1px solid rgba(165,136,228,0.5)"
          >
            Testnet · lock = {stakingContract.lockLabel} · 10% APR
          </Badge>
        </Flex>

        {/* Contract not deployed yet */}
        {!isConfigured && (
          <Flex
            direction="column"
            align="center"
            gap={2}
            p={4}
            rounded="xl"
            bg="rgba(255,200,0,0.1)"
            border="1px solid rgba(255,200,0,0.3)"
          >
            <Text fontSize="sm" textAlign="center" opacity={0.8}>
              Contract not yet deployed. Run{" "}
              <Text as="span" fontFamily="mono" fontSize="xs">
                deploy.sh
              </Text>{" "}
              and set{" "}
              <Text as="span" fontFamily="mono" fontSize="xs">
                NEXT_PUBLIC_STAKING_CONTRACT_TESTNET
              </Text>{" "}
              in your{" "}
              <Text as="span" fontFamily="mono" fontSize="xs">
                .env.local
              </Text>
              .
            </Text>
          </Flex>
        )}

        {/* Global stats */}
        <Flex direction="column" gap={2}>
          <Stat
            label="Total LP Staked"
            value={`${fromStroops(totalStaked)} LP`}
          />
          <Stat label="APR" value={`${stakingContract.aprPercent}%`} />
          <Stat label="Lock Period" value={stakingContract.lockLabel} />
          <Stat label="Reward Token" value="Zi" />
        </Flex>

        {/* Tabs */}
        <Tabs.Root defaultValue="stake" variant="plain" size="sm">
          <Tabs.List
            borderBottom="1px solid rgba(165,136,228,0.3)"
            gap={0}
          >
            {["stake", "unstake", "claim"].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="semibold"
                textTransform="capitalize"
                _selected={{
                  borderBottom: "2px solid",
                  borderColor: "#a588e4",
                  color: "#a588e4",
                }}
              >
                {tab}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* ── Stake tab ─────────────────────────────────────────────────── */}
          <Tabs.Content value="stake">
            <Flex direction="column" gap={4} pt={4}>
              <Flex direction="column" gap={1}>
                <Text fontSize="xs" opacity={0.6}>
                  LP Token Amount (Zi/XLM)
                </Text>
                <Input
                  type="number"
                  min="0"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </Flex>

              {hasStake && (
                <Stat
                  label="Currently Staked"
                  value={`${fromStroops(position!.staked)} LP`}
                />
              )}

              <Text fontSize="xs" opacity={0.5} textAlign="center">
                Staking locks your LP tokens for {stakingContract.lockLabel}.
                You can claim Zi rewards at any time.
              </Text>

              <Button
                size="xl"
                width="full"
                onClick={handleStake}
                disabled={!isConfigured || isStaking || !address}
              >
                {isStaking ? (
                  <Flex align="center" gap={2}>
                    <Spinner size="sm" />
                    Staking…
                  </Flex>
                ) : (
                  "Stake LP Tokens"
                )}
              </Button>
            </Flex>
          </Tabs.Content>

          {/* ── Unstake tab ───────────────────────────────────────────────── */}
          <Tabs.Content value="unstake">
            <Flex direction="column" gap={4} pt={4}>
              {isLoadingPosition ? (
                <Flex justify="center" py={4}>
                  <Spinner size="md" />
                </Flex>
              ) : hasStake ? (
                <>
                  <Stat
                    label="Staked"
                    value={`${fromStroops(position!.staked)} LP`}
                  />
                  <Stat
                    label="Pending Rewards"
                    value={`${fromStroops(position!.pendingRewards)} Zi`}
                  />
                  <Flex
                    justify="center"
                    align="center"
                    gap={2}
                    p={3}
                    rounded="xl"
                    bg={
                      isLocked
                        ? "rgba(255,100,100,0.1)"
                        : "rgba(100,255,180,0.1)"
                    }
                    border={`1px solid ${isLocked ? "rgba(255,100,100,0.3)" : "rgba(100,255,180,0.3)"}`}
                  >
                    <Text fontSize="sm" fontWeight="semibold">
                      {isLocked
                        ? formatCountdown(position!.unlockTime)
                        : "✓ Unlocked — ready to withdraw"}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" opacity={0.5} textAlign="center">
                    Unstaking automatically claims all pending Zi rewards.
                  </Text>
                  <Button
                    size="xl"
                    width="full"
                    onClick={handleUnstake}
                    disabled={
                      !isConfigured || isUnstaking || isLocked || !address
                    }
                  >
                    {isUnstaking ? (
                      <Flex align="center" gap={2}>
                        <Spinner size="sm" />
                        Unstaking…
                      </Flex>
                    ) : (
                      "Unstake & Claim"
                    )}
                  </Button>
                </>
              ) : (
                <Text
                  textAlign="center"
                  fontSize="sm"
                  opacity={0.6}
                  py={4}
                >
                  No staked position found.
                </Text>
              )}
            </Flex>
          </Tabs.Content>

          {/* ── Claim tab ─────────────────────────────────────────────────── */}
          <Tabs.Content value="claim">
            <Flex direction="column" gap={4} pt={4}>
              {isLoadingPosition ? (
                <Flex justify="center" py={4}>
                  <Spinner size="md" />
                </Flex>
              ) : (
                <>
                  <Stat
                    label="Pending Zi Rewards"
                    value={
                      position
                        ? `${fromStroops(position.pendingRewards)} Zi`
                        : "—"
                    }
                  />
                  <Text fontSize="xs" opacity={0.5} textAlign="center">
                    Claim Zi at any time without affecting your staked LP tokens
                    or lock period.
                  </Text>
                  <Button
                    size="xl"
                    width="full"
                    onClick={handleClaim}
                    disabled={
                      !isConfigured || isClaiming || !hasPending || !address
                    }
                  >
                    {isClaiming ? (
                      <Flex align="center" gap={2}>
                        <Spinner size="sm" />
                        Claiming…
                      </Flex>
                    ) : (
                      "Claim Zi Rewards"
                    )}
                  </Button>
                </>
              )}
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </ModalContent>
    </Modal>
  );
};

export default StakingModal;
