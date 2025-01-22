import { FC } from "react";

import { Flex, Text } from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from ".";
import { ModalProps } from "./Modal";

interface Props extends ModalProps {
    title: string;
    description: string;
}

const GuideModal: FC<Props> = ({ title, description, children, ...props }) => {
    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent w='320px' p={4} direction='column' gap={2}>
                <ModalCloseButton />
                <Flex direction='column' gap={1}>
                    <Text fontSize='xl'>{title}</Text>
                    <Text fontSize='sm'>{description}</Text>
                </Flex>
                {children}
            </ModalContent>
        </Modal>
    )
}

export default GuideModal;
