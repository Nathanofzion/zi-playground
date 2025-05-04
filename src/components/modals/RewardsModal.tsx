import { FC, useMemo } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useRewards from "@/hooks/useRewards";
import useWallets from "@/hooks/useWallets";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import { WalletConnectButton } from "../wallet";

const RewardsModal: FC<ModalProps> = (props) => {
  const { address } = useSorobanReact();
  const wallets = useWallets();
  const { rewards, claimRewards, isClaiming } = useRewards();

  const wallet = useMemo(
    () => wallets.find((wallet) => wallet.id == "passkey")!,
    [wallets]
  );

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
        {address ? (
          <>
            <Flex direction="column" gap={1}>
              <Text>
                You&apos;ve invited <b>{rewards.referral_count}</b> friends to
                join the platform.
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
            <Flex justify="end">
              <Button
                disabled={rewards.remaining_rewards === 0 || isClaiming}
                loading={isClaiming}
                onClick={() => claimRewards()}
              >
                Claim {rewards.remaining_rewards} ZI
              </Button>
            </Flex>
          </>
        ) : (
          <>
            <Text>Please connect your wallet to claim your reward.</Text>
            <WalletConnectButton wallet={wallet} />
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RewardsModal;
