"use client";
import { FC, useContext, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, Flex, Heading, Separator, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useRewards from "@/hooks/useRewards";
import { AppContext } from "@/providers/AppProvider";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import StatsQRModal from "./StatsQRModal";

const RewardsModal: FC<ModalProps> = (props) => {
  const router = useRouter();
  const { address } = useSorobanReact();
  const { rewards, claimRewards, isClaiming } = useRewards();
  const { user, openEmailRegistrationModal } = useContext(AppContext);
  const [showStatsQR, setShowStatsQR] = useState(false);

  const hasEmail = !!user?.email;

  return (
    <>
      <Modal {...props}>
        <ModalOverlay />
        <ModalContent
          p={{ base: 4, lg: 8 }}
          w="full"
          maxW={{ base: "340px", lg: "460px" }}
          direction="column"
          gap={4}
        >
          <ModalCloseButton />
          <Heading as="h2" textAlign="center" size="lg">
            Rewards
          </Heading>

          {/* Stats summary */}
          <Flex direction="column" gap={2}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm">Friends invited</Text>
              <Badge colorScheme="purple">{rewards.referral_count}</Badge>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm">Total earned</Text>
              <Badge colorScheme="green">{rewards.total_rewards} ZI</Badge>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm">Already claimed</Text>
              <Badge>{rewards.claimed_rewards} ZI</Badge>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="semibold">
                Available to claim
              </Text>
              <Badge colorScheme="blue" fontSize="sm">
                {rewards.remaining_rewards} ZI
              </Badge>
            </Flex>
          </Flex>

          <Separator />

          {/* Single action: Stats & QR Code (email registered) OR Register Email */}
          {hasEmail ? (
            <Button w="full" onClick={() => setShowStatsQR(true)}>
              Stats &amp; QR Code
            </Button>
          ) : (
            <Flex direction="column" align="center" gap={2}>
              <Text fontSize="sm" color="orange.500" textAlign="center">
                No email registered — add one to secure your rewards
              </Text>
              <Button
                w="full"
                variant="outline"
                onClick={() => {
                  props.onClose?.();
                  openEmailRegistrationModal?.();
                }}
              >
                Register Email
              </Button>
            </Flex>
          )}

          <Separator />

          {/* Actions */}
          <Flex justify="end" gap={2}>
            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard");
                props.onClose?.();
              }}
            >
              Dashboard
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

      <StatsQRModal
        isOpen={showStatsQR}
        onClose={() => setShowStatsQR(false)}
        address={address}
        email={user?.email ?? null}
        rewards={rewards}
        onChangeEmail={() => {
          setShowStatsQR(false);
          props.onClose?.();
          openEmailRegistrationModal?.();
        }}
      />
    </>
  );
};

export default RewardsModal;

