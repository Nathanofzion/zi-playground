"use client";
import { FC, Suspense, lazy } from "react";

import { Badge, Box, Flex, Heading, HStack, Separator, Spinner, Text } from "@chakra-ui/react";
import { SocialIcon } from "react-social-icons";

import { IRewards } from "@/interfaces";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const QRCodeSVG = lazy(() =>
  import("qrcode.react").then((m) => ({ default: m.QRCodeSVG }))
);

interface StatsQRModalProps extends ModalProps {
  address?: string | null;
  email: string | null;
  rewards: IRewards;
  onChangeEmail?: () => void;
}

const StatsQRModal: FC<StatsQRModalProps> = ({
  address,
  email,
  rewards,
  onChangeEmail,
  ...props
}) => {
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
          Stats &amp; QR Code
        </Heading>

        {/* Registered email */}
        {email && (
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
            <Flex align="center" justify="space-between">
              <Text fontWeight="semibold" fontSize="sm">
                {email}
              </Text>
              {onChangeEmail && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    props.onClose?.();
                    onChangeEmail();
                  }}
                >
                  Change
                </Button>
              )}
            </Flex>
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

        {/* Invite link + QR */}
        <Flex direction="column" gap={3}>
          <Text fontWeight="semibold" fontSize="sm">
            Your invite link
          </Text>
          <Flex align="center" gap={2}>
            <Text fontSize="xs" truncate flex="1" color="gray.600">
              {inviteLink || "Connect a wallet to generate your link"}
            </Text>
            {inviteLink && (
              <ClipboardRoot value={inviteLink}>
                <ClipboardIconButton />
              </ClipboardRoot>
            )}
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

        <Separator />

        {/* Share */}
        <Flex direction="column" align="center" gap={3}>
          <Text fontWeight="medium" fontSize="sm">
            Share with friends
          </Text>
          <HStack spaceX={6} justify="center">
            <Box cursor="pointer" onClick={() => handleShare("x")}>
              <SocialIcon network="x" url="" style={{ width: 40, height: 40 }} />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("whatsapp")}>
              <SocialIcon network="whatsapp" url="" style={{ width: 40, height: 40 }} />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("facebook")}>
              <SocialIcon network="facebook" url="" style={{ width: 40, height: 40 }} />
            </Box>
          </HStack>
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
      </ModalContent>
    </Modal>
  );
};

export default StatsQRModal;
