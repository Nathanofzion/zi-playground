import { FC, useEffect, useState } from "react";

import { Flex, For, Image, Link, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";
import { Connector } from '@soroban-react/types';

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { useColorModeValue } from "../ui/color-mode";

interface IWallet {
    id: string;
    name: string;
    sname?: string;
    iconUrl: string;
    isConnected: boolean;
}

const ConnectWalletModal: FC<ModalProps> = ({ isOpen, onClose }) => {
    const { setActiveConnectorAndConnect, connectors } = useSorobanReact();
    const [wallets, setWallets] = useState<IWallet[]>([]);

    useEffect(() => {
        (async () => {
            const wallets = await Promise.all(connectors.map(async (connector) => ({
                id: connector.id,
                name: connector.name,
                sname: connector.shortName,
                iconUrl: typeof connector.iconUrl == 'string' ? connector.iconUrl : await connector.iconUrl(),
                isConnected: await connector.isConnected(),
            })));
            setWallets(wallets);
        })();
    }, [connectors]);

    const handleConnect = async (connector: Connector) => {
        const isConnected = await connector.isConnected();
        if (!isConnected) {
            const userAgent = navigator.userAgent;
            if (/android/i.test(userAgent)) {
                window.open(connector.downloadUrls?.android, '_blank');
            } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
                window.open(connector.downloadUrls?.ios, '_blank');
            } else {
                window.open(connector.downloadUrls?.browserExtension, '_blank');
            }
            return;
        }
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
                        {(wallet, index) => (
                            <Flex key={wallet.id} p='16px' justify='space-between' bg={useColorModeValue('#F8F8F8', '#0F1016')} rounded='16px' cursor='pointer' onClick={() => handleConnect(connectors[index])}>
                                <Flex gap='16px'>
                                    <Image alt={wallet.sname} src={wallet.iconUrl} w='24px' h='24px' rounded='8px' />
                                    <Text>
                                        {wallet.name} Wallet
                                    </Text>
                                </Flex>
                                {wallet.isConnected ? (
                                    <Text color={useColorModeValue('#F66B3C', '#B4EFAF')}>
                                        {wallet.sname == 'Passkey' ? 'Available' : 'Detected'}
                                    </Text>
                                ) : <Text color='#F66B3C'>Install</Text>}
                            </Flex>
                        )}
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
