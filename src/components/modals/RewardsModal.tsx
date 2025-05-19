import { FC } from "react";
import { useRouter } from "next/navigation";

import { Flex, Heading, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useRewards from "@/hooks/useRewards";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const getInviteLink = (address?: string) => {
  if (typeof window === "undefined" || !address) return "";
  return `${window.location.origin}/?ref=${address}`;
};

const RewardsModal: FC<ModalProps> = (props) => {
  const router = useRouter();
  const { address } = useSorobanReact();
  const { rewards, claimRewards, isClaiming } = useRewards();

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={{ base: 4, lg: 8 }}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          Rewards
        </Heading>
        <Flex direction="column" gap={1}>
          <Text>
            You&apos;ve invited <b>{rewards.referral_count}</b> friends to join
            the platform.
          </Text>
          <Text>
            You&apos;ve earned <b>{rewards.total_rewards}</b> ZI from your
            referrals.
          </Text>
          <Text>
            You&apos;ve claimed <b>{rewards.claimed_rewards}</b> ZI.
          </Text>
          <Text>
            You have <b>{rewards.remaining_rewards}</b> rewards to claim.
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Text truncate>{getInviteLink(address)}</Text>
          <ClipboardRoot value={getInviteLink(address)}>
            <ClipboardIconButton />
          </ClipboardRoot>
        </Flex>
        <Flex justify="end" gap={2}>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/dashboard");
              props.onClose?.();
            }}
          >
            Go to Dashboard
          </Button>
          <Button
            disabled={rewards.remaining_rewards === 0 || isClaiming}
            loading={isClaiming}
            onClick={() => claimRewards()}
          >
            Claim {rewards.remaining_rewards} ZI
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default RewardsModal;
