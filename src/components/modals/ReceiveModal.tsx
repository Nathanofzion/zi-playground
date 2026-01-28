import { FC, useEffect, useState } from "react";

import { Box, Flex, Heading, QrCode, Text, Badge, Link } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import { truncateAddress } from "@/utils";
import { getUnderlyingAccount } from "@/lib/walletManager";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const ReceiveModal: FC<ModalProps> = (props) => {
  const { address, activeConnector } = useSorobanReact();
  const [underlyingAccount, setUnderlyingAccount] = useState<string | null>(null);
  
  // ⚠️ CRITICAL: Check active connector, not localStorage, to determine wallet type
  // This ensures we show the correct badge for the currently connected wallet
  const isPasskeyWallet = activeConnector?.id === 'passkey';
  const isCAddress = address?.startsWith('C');
  
  // For PasskeyKit wallets, get the underlying G-address where funds actually live
  useEffect(() => {
    if (isPasskeyWallet && props.isOpen) {
      getUnderlyingAccount().then(setUnderlyingAccount);
    }
  }, [isPasskeyWallet, props.isOpen]);
  
  // Show the underlying account for PasskeyKit wallets, otherwise show the regular address
  const displayAddress = isPasskeyWallet && underlyingAccount ? underlyingAccount : address;
  const shouldShowUnderlyingInfo = isPasskeyWallet && underlyingAccount && isCAddress;

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
              value={displayAddress}
              encoding={{ ecc: "Q" }}
            >
              <QrCode.Frame>
                <QrCode.Pattern />
              </QrCode.Frame>
            </QrCode.Root>
          </Box>
          <Flex direction="column" align="center" gap={2}>
            <Flex align="center" gap={2}>
              <Text fontSize="small">{truncateAddress(displayAddress)}</Text>
              <ClipboardRoot value={displayAddress}>
                <ClipboardIconButton />
              </ClipboardRoot>
            </Flex>
            {shouldShowUnderlyingInfo && (
              <Flex direction="column" align="center" gap={1} fontSize="xs">
                <Text color="gray.500">Contract: {truncateAddress(address)}</Text>
                <Link
                  href={`https://stellar.expert/explorer/testnet/account/${underlyingAccount}`}
                  color="blue.400"
                  _hover={{ textDecoration: "underline" }}
                  isExternal
                >
                  View funds on Stellar Expert →
                </Link>
              </Flex>
            )}
            {isPasskeyWallet && underlyingAccount && (
              <Badge colorScheme="green" fontSize="xs">
                PasskeyKit Wallet (Underlying Account)
              </Badge>
            )}
            {isPasskeyWallet && !underlyingAccount && isCAddress && (
              <Badge colorScheme="purple" fontSize="xs">
                Smart Contract Wallet (C-address)
              </Badge>
            )}
            {!isPasskeyWallet && isCAddress && (
              <Badge colorScheme="blue" fontSize="xs">
                Contract Address
              </Badge>
            )}
            {!isPasskeyWallet && !isCAddress && (
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
