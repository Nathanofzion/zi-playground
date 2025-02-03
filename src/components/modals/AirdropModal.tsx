import { FC, useContext } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAirdrop from "@/hooks/useAirdrop";
import { AppContext } from "@/providers";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
    const { openPasskeyGuideModal, openCubeGuideModal, openParticlesGuideModal, openThemeGuideModal, setStartAnimation } = useContext(AppContext);
    const { address } = useSorobanReact();
    const { status } = useAirdrop();

    const renderNextStep = () => {
        if (status == 0) {
            return (
                <Flex direction='column' gap={2}>
                    <Text textAlign='left'>
                        Step 2). Spin the Cube to get the first Airdrop
                    </Text>
                    <Button size='xl' onClick={() => {
                        openCubeGuideModal?.();
                        onClose?.();
                    }}>
                        Spin cube
                    </Button>
                </Flex>
            )
        }

        if (status == 1) {
            return (
                <Flex direction='column' gap={2}>
                    <Text textAlign='left'>
                        Step 3). Create So Particles by clicking the screen
                    </Text>
                    <Button size='xl' onClick={() => {
                        openParticlesGuideModal?.();
                        onClose?.();
                    }}>
                        Create particles
                    </Button>
                </Flex>
            )
        }

        if (status == 2) {
            return (
                <Flex direction='column' gap={2}>
                    <Text textAlign='left'>
                        Step 4). Change the Teal Moon theme to get your last Zi AirDrop
                    </Text>
                    <Button size='xl' onClick={() => {
                        openThemeGuideModal?.();
                        onClose?.();
                    }}>
                        Change theme
                    </Button>
                </Flex>
            )
        }

        return (
            <>
                You received all types of Zi Airdrop
            </>
        )
    }

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
                        {!address ? (
                            <Flex direction='column' gap={2}>
                                <Text textAlign='left'>
                                    Step 1). Use PasskeyID to Connect a Wallet
                                </Text>
                                <Button size='xl' onClick={() => {
                                    openPasskeyGuideModal?.();
                                    setStartAnimation?.(true);
                                    onClose?.();
                                }}>
                                    Connect wallet
                                </Button>
                            </Flex>
                        ) : renderNextStep()}
                    </Flex>
                </Text>
            </ModalContent>
        </Modal>
    )
}

export default AirdropModal;
