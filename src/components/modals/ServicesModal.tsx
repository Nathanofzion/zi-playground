import { FC } from "react";

import { Grid } from "@chakra-ui/react";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const ServicesModal: FC<ModalProps> = (props) => {
    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p='48px' w='full' maxW={{ base: '360px', lg: '480px' }}>
                <ModalCloseButton />
                <Grid w='full' templateColumns='repeat(2, minmax(0, 1fr))' gap='32px'>
                    <Button size='2xl'>
                        Send
                    </Button>
                    <Button size='2xl'>
                        Receive
                    </Button>
                    <Button size='2xl'>
                        Swap
                    </Button>
                    <Button size='2xl'>
                        Liquidity
                    </Button>
                    <Button size='2xl'>
                        Bridge
                    </Button>
                    <Button size='2xl'>
                        Info
                    </Button>
                </Grid>
            </ModalContent>
        </Modal>
    )
}

export default ServicesModal;
