import { FC } from "react";

import { Flex, For, Link, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Connector } from '@soroban-react/types';

import useWallets from "@/hooks/useWallets";
import { connect } from "@/lib/wallet";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";
import { WalletConnectButton } from "../wallet";

const ConnectWalletModal: FC<ModalProps> = ({ isOpen, onClose }) => {
    const { setActiveConnectorAndConnect, connectors } = useSorobanReact();
    const wallets = useWallets();

    const handleConnect = async (connector: Connector) => {
        await connect(connector);
        setActiveConnectorAndConnect?.(connector);
        onClose?.();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p='32px' w='full' maxW={{ base: '360px', lg: '420px' }} direction='column' gap='24px'>
                <ModalCloseButton />
                <Text fontSize='24px'>
                    Connect a wallet to continue
                </Text>
                <Text fontSize='14px'>
                    Choose how you want to connect.
                    If you don&apos;t have a wallet, you can select a provider and create one.
                </Text>
                <Flex direction='column' gap='16px'>
                    <For each={wallets}>
                        {(wallet, index) => <WalletConnectButton key={wallet.id} wallet={wallet} onClick={() => handleConnect(connectors[index])} />}
                    </For>
                </Flex>
                <Text fontSize='12px' color={useColorModeValue('#00615F', 'white')} opacity={0.5}>
                    By connecting a wallet, you agree to Soroswap <Link color={useColorModeValue('#F66B3C', '#00615F')}>Terms of Service</Link>
                </Text>
            </ModalContent>
        </Modal>
    )
}

export default ConnectWalletModal;
