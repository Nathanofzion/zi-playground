import { FC, ReactNode, useState } from "react";

import { Flex, Spinner, Text } from "@chakra-ui/react";

import useAirdrop, { Action } from "@/hooks/useAirdrop";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from ".";
import Button from "../Button";
import { ModalProps } from "./Modal";

interface Props extends ModalProps {
    title: string;
    description: string;
    congratulation?: ReactNode;
    action?: Action;
    showButton?: boolean;
}

const GuideModal: FC<Props> = ({ title, description, congratulation, children, action, showButton, ...props }) => {
    const { getAirdrop, isGettingAirdrop } = useAirdrop();

    const [isCompleted, setIsCompleted] = useState(false);

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent w='360px' p={4} direction='column' gap={2}>
                <ModalCloseButton />
                <Flex direction='column' gap={1}>
                    <Text fontSize='xl'>{title}</Text>
                    <Text fontSize='sm'>{description}</Text>
                </Flex>
                {children}
                {(!isCompleted && showButton) && (
                    <Button
                        gap={1}
                        disabled={isGettingAirdrop}
                        onClick={async () => {
                            if (action) {
                                await getAirdrop(action);
                                setIsCompleted(true);
                            }
                        }}>
                        {isGettingAirdrop && <Spinner size='sm' />}
                        Get airdrop
                    </Button>
                )}
                {isCompleted && congratulation}
            </ModalContent>
        </Modal>
    )
}

export default GuideModal;
