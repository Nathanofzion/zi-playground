"use client";
import { FC, Suspense, lazy, useContext } from "react";
import { useRouter } from "next/navigation";

import { Badge, Box, Flex, Heading, HStack, Separator, Spinner, Text } from "@chakra-ui/react";
import { SocialIcon } from "react-social-icons";
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
  const { user } = useContext(AppContext);

  const inviteLink =
    address && typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${address}`
      : "";

  const shareText = "Join me on Zi Playground and earn ZI tokens!";

  const handleShare = (platform: "facebook" | "whatsapp" | "x") => {
    if (!inviteLink) return;
    const encodedLink = encodeURIComponent(inviteLink);
    const encodedText = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      x: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

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
          {user?.email ? (
            <Flex align="center" justify="space-between" gap={2}>
              <Text fontWeight="semibold" fontSize="sm">{user.email}</Text>
              {user?.email_verified ? (
                <Text fontSize="xs" color="green.500" fontWeight="medium">✓ Verified</Text>
              ) : (
                <Text fontSize="xs" color="orange.400" fontWeight="medium">⚠ Unverified</Text>
              )}
            </Flex>
          ) : (
            <Text fontSize="sm" color="orange.500">
              No email registered — add one to secure your rewards
            </Text>
          )}
        </Box>

        {/* Verification notice */}
        {user?.email && !user?.email_verified && (
          <Box bg="orange.50" _dark={{ bg: "orange.900" }} rounded="lg" px={4} py={2}>
            <Text fontSize="xs" color="orange.600" _dark={{ color: "orange.200" }}>
              Check your inbox for a verification link. Rewards cannot be claimed until your email is verified.
            </Text>
          </Box>
        )}

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

        {/* Invite link + QR + share — user has registered email to reach here */}
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

        {/* Share socials */}
        <Box>
          <Text fontWeight="semibold" fontSize="sm" mb={2}>
            Share with friends
          </Text>
          <HStack spaceX={5}>
            <Box cursor="pointer" onClick={() => handleShare("x")}>
              <SocialIcon network="x" url="" style={{ width: 36, height: 36 }} />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("whatsapp")}>
              <SocialIcon network="whatsapp" url="" style={{ width: 36, height: 36 }} />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("facebook")}>
              <SocialIcon network="facebook" url="" style={{ width: 36, height: 36 }} />
            </Box>
          </HStack>
        </Box>

        {/* Actions */}
        <Flex justify="end" gap={2} pt={2}>
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
            disabled={rewards.remaining_rewards === 0 || isClaiming || !user?.email_verified}
            loading={isClaiming}
            onClick={() => claimRewards()}
            title={!user?.email_verified ? "Verify your email to claim rewards" : undefined}
          >
            Claim {rewards.remaining_rewards} ZI
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default RewardsModal;

