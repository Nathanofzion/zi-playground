import { FC } from "react";

import { Heading, Text } from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const BridgeModal: FC<ModalProps> = (props) => {
    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p={8} w='full' maxW={{ base: '320px', lg: '420px' }} direction='column' gap={4}>
                <ModalCloseButton />
                <Heading as="h2" textAlign="center" size="lg">
                    BRIDGE
                </Heading>
                <Text textAlign='center'>
                    Coming soon...
                </Text>
            </ModalContent>
        </Modal>
    )
}

export default BridgeModal;
