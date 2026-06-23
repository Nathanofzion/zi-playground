"use client";
import { FC, Suspense, lazy, useContext } from "react";
import { useRouter } from "next/navigation";

import { Badge, Box, Flex, Heading, Separator, Spinner, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useRewards from "@/hooks/useRewards";
import { AppContext } from "@/providers/AppProvider";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const QRCodeSVG = lazy(() =>
  import("qrcode.react").then((m) => ({ default: m.QRCodeSVG }))
);

const RewardsModal: FC<ModalProps> = (props) => {
  const router = useRouter();
  const { address } = useSorobanReact();
  const { rewards, claimRewards, isClaiming } = useRewards();
  const { user, openEmailRegistrationModal } = useContext(AppContext);

  const inviteLink =
    address && typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${address}`
      : "";

  const hasEmail = !!user?.email;

  return (
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

        {/* Email status */}
        <Box
          bg="gray.50"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          px={4}
          py={3}
        >
          <Text fontSize="xs" color="gray.500" mb={1}>
            Registered email
          </Text>
          {hasEmail ? (
            <Text fontWeight="semibold" fontSize="sm">
              {user!.email}
            </Text>
          ) : (
            <Text fontSize="sm" color="orange.500">
              No email registered — add one to secure your rewards
            </Text>
          )}
        </Box>

        {/* Stats */}
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

        {/* How it works */}
        <Box>
          <Text fontWeight="semibold" fontSize="sm" mb={2}>
            How rewards work
          </Text>
          <Text fontSize="xs" color="gray.500" lineHeight="tall">
            Share your invite link. Each friend who joins and connects a wallet
            earns you ZI tokens. Claim your balance any time — tokens go
            directly to your connected wallet.
          </Text>
        </Box>

        <Separator />

        {/* Invite link + QR */}
        <Flex direction="column" gap={3}>
          <Text fontWeight="semibold" fontSize="sm">
            Your magic invite link
          </Text>
          <Flex align="center" gap={2}>
            <Text fontSize="xs" truncate flex="1" color="gray.600">
              {inviteLink}
            </Text>
            <ClipboardRoot value={inviteLink}>
              <ClipboardIconButton />
            </ClipboardRoot>
          </Flex>
          {inviteLink && (
            <Flex justify="center" pt={1}>
              <Suspense fallback={<Spinner size="sm" />}>
                <Box
                  p={3}
                  bg="white"
                  rounded="md"
                  shadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <QRCodeSVG
                    value={inviteLink}
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                </Box>
              </Suspense>
            </Flex>
          )}
        </Flex>

        {/* Actions — Dashboard replaces Register Email once email is set */}
        <Flex justify="end" gap={2} pt={2}>
          {hasEmail ? (
            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard");
                props.onClose?.();
              }}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                props.onClose?.();
                openEmailRegistrationModal?.();
              }}
            >
              Register Email
            </Button>
          )}
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

