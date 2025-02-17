import { FC } from "react";

import { Flex, Image, Spinner, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAssets from "@/hooks/useAssets";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const BalanceModal: FC<ModalProps> = (props) => {
    const { address } = useSorobanReact();
    const { assets } = useAssets();

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent
                left={{ base: '50%', lg: '75%' }}
                p={{ base: 6, lg: 12 }}
                w='full'
                maxW={{ base: '320px', lg: '420px' }}
                direction='column'
                gap='12px'
            >
                <ModalCloseButton />
                <Flex direction='column' gap='4px'>
                    <Text fontSize='18px'>
                        Your wallet
                    </Text>
                    <Text fontSize='12px' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
                        {address}
                    </Text>
                </Flex>
                <Flex
                    maxH='480px'
                    direction='column'
                    gap={2}
                    overflowY='auto'
                >
                    {assets.map((asset, index) => (
                        <Flex key={index} gap={2}>
                            <Flex flex='1 1 0' gap={2}>
                                <Image flex='none' w={10} h={10} alt={asset.code} src={asset.icon} />
                                <Flex direction='column' justify='space-around'>
                                    <Text maxW='120px' fontSize='small' truncate>
                                        {asset.name}
                                    </Text>
                                    <Text fontSize='x-small'>
                                        {asset.code} ({asset.domain})
                                    </Text>
                                </Flex>
                            </Flex>
                            <Flex pr={4} direction='column' justify='space-around'>
                                {asset.balance != undefined ? (
                                    <Text>
                                        {asset.balance}
                                    </Text>
                                ) : (
                                    <Spinner size='sm' />
                                )}
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </ModalContent>
        </Modal>
    )
}

export default BalanceModal;
