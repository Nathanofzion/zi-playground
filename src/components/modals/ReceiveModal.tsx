import { FC } from "react";

import { Box, Flex, Heading, QrCode, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import { truncateAddress } from "@/utils";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";

const ReceiveModal: FC<ModalProps> = (props) => {
    const { address } = useSorobanReact();

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p={8} w='full' maxW="280px" direction='column' gap={4}>
                <ModalCloseButton />
                <Heading as="h2" textAlign="center" size="lg">
                    RECEIVE
                </Heading>
                <Flex direction="column" align="center" gap={4}>
                    <Box p={1} bg="white">
                        <QrCode.Root value={address} color="black">
                            <QrCode.Frame>
                                <QrCode.Pattern />
                            </QrCode.Frame>
                        </QrCode.Root>
                    </Box>
                    <Flex align="center" gap={2}>
                        <Text fontSize="small">
                            {truncateAddress(address)}
                        </Text>
                        <ClipboardRoot value={address}>
                            <ClipboardIconButton />
                        </ClipboardRoot>
                    </Flex>
                </Flex>
            </ModalContent>
        </Modal>
    )
}

export default ReceiveModal;
