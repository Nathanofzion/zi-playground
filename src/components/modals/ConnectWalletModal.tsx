import { FC, useState } from "react";
import { Checkbox, Flex, For, Link, Text } from "@chakra-ui/react";
import useWallets from "@/hooks/useWallets";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";
import { WalletConnectButton } from "../wallet";
import TermsModal from "./TermsModal";

const WALLET_INFO_URLS: Record<string, string> = {
  passkey: 'http://passkeyid.org/',
  freighter: 'https://www.freighter.app/',
  lobstr: 'https://lobstr.co/trade/native/Zi:GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7',
};

const ConnectWalletModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const wallets = useWallets();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const accentColor = useColorModeValue('#F66B3C', '#B4EFAF');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        p="32px"
        w="full"
        maxW={{ base: "360px", lg: "420px" }}
        direction="column"
        gap="24px"
      >
        <ModalCloseButton />
        <Text fontSize="24px">Connect a wallet to continue</Text>
        <Text fontSize="14px">
          Choose how you want to connect. If you don&apos;t have a wallet, you
          can select a provider and create one.
        </Text>
        <Flex direction="column" gap="16px">
          <For each={wallets}>
            {(wallet) => (
              <Flex
                key={wallet.id}
                direction="column"
                opacity={termsAgreed ? 1 : 0.45}
                pointerEvents={termsAgreed ? 'auto' : 'none'}
                transition="opacity 0.2s"
              >
                <WalletConnectButton
                  wallet={wallet}
                  onConnect={onClose}
                  infoUrl={WALLET_INFO_URLS[wallet.id] ?? WALLET_INFO_URLS[wallet.sname?.toLowerCase() ?? '']}
                />
              </Flex>
            )}
          </For>
        </Flex>

        {/* Terms agreement checkbox */}
        <Flex align="center" gap="10px">
          <Checkbox.Root
            checked={termsAgreed}
            onCheckedChange={(e) => setTermsAgreed(!!e.checked)}
            size="sm"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              border="1.5px solid"
              borderColor={termsAgreed ? accentColor : 'gray.400'}
              bg={termsAgreed ? accentColor : 'transparent'}
              rounded="4px"
              w="16px"
              h="16px"
              flexShrink={0}
            >
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Root>
          <Text fontSize="12px" color={useColorModeValue('#374151', '#9ca3af')}>
            I agree to the{' '}
            <Link
              color={accentColor}
              cursor="pointer"
              onClick={() => setShowTerms(true)}
              textDecoration="underline"
            >
              Terms and Conditions
            </Link>
          </Text>
        </Flex>

        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </ModalContent>
    </Modal>
  );
};

export default ConnectWalletModal;