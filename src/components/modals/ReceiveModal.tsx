import { FC } from "react";

import { Box, Flex, Heading, QrCode, Text, Badge } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import { truncateAddress } from "@/utils";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const ReceiveModal: FC<ModalProps> = (props) => {
  const { address, activeConnector } = useSorobanReact();
  // ⚠️ CRITICAL: Check active connector, not localStorage, to determine wallet type
  // This ensures we show the correct badge for the currently connected wallet
  const isPasskeyWallet = activeConnector?.id === 'passkey';
  const isCAddress = address?.startsWith('C');

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW="280px"
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          RECEIVE
        </Heading>
        <Flex direction="column" align="center" gap={4}>
          <Box p={2} bg="white">
            <QrCode.Root
              size="lg"
              color="black"
              value={address}
              encoding={{ ecc: "Q" }}
            >
              <QrCode.Frame>
                <QrCode.Pattern />
              </QrCode.Frame>
            </QrCode.Root>
          </Box>
          <Flex direction="column" align="center" gap={2}>
            <Flex align="center" gap={2}>
              <Text fontSize="small">{truncateAddress(address)}</Text>
              <ClipboardRoot value={address}>
                <ClipboardIconButton />
              </ClipboardRoot>
            </Flex>
            {isPasskeyWallet && isCAddress && (
              <Badge colorScheme="purple" fontSize="xs">
                Smart Contract Wallet (C-address)
              </Badge>
            )}
            {!isPasskeyWallet && isCAddress && (
              <Badge colorScheme="blue" fontSize="xs">
                Contract Address
              </Badge>
            )}
            {!isCAddress && (
              <Badge colorScheme="green" fontSize="xs">
                Traditional Wallet (G-address)
              </Badge>
            )}
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default ReceiveModal;
