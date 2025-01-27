import { FC } from "react";

import { Flex, Spinner, Text } from "@chakra-ui/react";

import useAirdrop, { Action } from "@/hooks/useAirdrop";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from ".";
import Button from "../Button";
import { ModalProps } from "./Modal";

interface Props extends ModalProps {
    title: string;
    description: string;
    action?: Action;
    showButton?: boolean;
}

const GuideModal: FC<Props> = ({ title, description, children, action, showButton, ...props }) => {
    const { getAirdrop, isLoading } = useAirdrop();
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
                {showButton && (
                    <Button gap={1} onClick={() => action && getAirdrop(action)}>
                        {isLoading && <Spinner size='sm' />}
                        Get airdrop
                    </Button>
                )}
            </ModalContent>
        </Modal>
    )
}

export default GuideModal;
