import { FC } from "react";

import { Flex, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useGetNativeTokenBalance from "@/hooks/useGetNativeTokenBalance";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const BalanceModal: FC<ModalProps> = (props) => {
    const { address } = useSorobanReact();
    const { balance } = useGetNativeTokenBalance();

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '85%' }} p='48px' w='full' maxW={{ base: '360px', lg: '420px' }} direction='column' gap='12px'>
                <ModalCloseButton />
                <Flex direction='column' gap='4px'>
                    <Text fontSize='18px'>
                        Your wallet
                    </Text>
                    <Text fontSize='12px' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
                        {address}
                    </Text>
                </Flex>
                <Flex direction='column' gap='4px'>
                    <Text fontSize='18px'>
                        Balance
                    </Text>
                    <Text fontSize='14px'>
                        {balance} XLM
                    </Text>
                </Flex>
            </ModalContent>
        </Modal>
    )
}

export default BalanceModal;
