import { FC, useMemo } from "react";

import { Flex, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Connector } from "@soroban-react/types";

import Modal, { ModalProps } from "@/components/common/Modal";
import useWallets from "@/hooks/useWallets";
import { connect } from "@/lib/wallet";
import { ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { WalletConnectButton } from "../wallet";

const PasskeyModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const { connectors, setActiveConnectorAndConnect } = useSorobanReact();
  const wallets = useWallets();

  const wallet = useMemo(() => wallets.find(wallet => wallet.id == 'passkey')!, [wallets]);
  const connector = useMemo(() => connectors[wallets.findIndex(wallet => wallet.id == 'passkey')]!, [connectors, wallets]);

  const handleConnect = async (connector: Connector) => {
    await connect(connector);
    setActiveConnectorAndConnect?.(connector);
    onClose?.();
  }

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent w="360px">
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <ModalCloseButton />
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">
              Connect passkey
            </Text>
            <Text fontSize="sm">
              Try to connect your passkey and get your ZI airdrop
            </Text>
          </Flex>
          <WalletConnectButton wallet={wallet} onClick={() => handleConnect(connector)} />
        </Flex>
      </ModalContent>
    </Modal>
  )
}

export default PasskeyModal;
