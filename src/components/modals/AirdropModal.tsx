import { FC, useContext } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";

import { AppContext } from "@/providers";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
    const { openCubeGuideModal, openParticlesGuideModal, openThemeGuideModal } = useContext(AppContext);

    return (
        <Modal onClose={onClose} {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p={8} w='full' maxW={{ base: '320px', lg: '420px' }} direction='column' gap={4}>
                <ModalCloseButton />
                <Heading as="h2" textAlign="center" size="lg">
                    AIRDROP
                </Heading>
                <Text textAlign='center'>
                    <Flex direction='column' gap={4}>
                        <Button size='xl' onClick={() => {
                            openCubeGuideModal?.();
                            onClose?.();
                        }}>
                            Spin cube
                        </Button>
                        <Button size='xl' onClick={() => {
                            openParticlesGuideModal?.();
                            onClose?.();
                        }}>
                            Create particles
                        </Button>
                        <Button size='xl' onClick={() => {
                            openThemeGuideModal?.();
                            onClose?.();
                        }}>
                            Change theme
                        </Button>
                    </Flex>
                </Text>
            </ModalContent>
        </Modal>
    )
}

export default AirdropModal;
