import { FC } from "react";
import { SocialIcon } from 'react-social-icons';

import {
    Box, Flex, Heading,
    HStack,
    Input, Text
} from "@chakra-ui/react";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const LoginModal: FC<ModalProps> = (props) => {
    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent left={{ base: '50%', lg: '75%' }} p={8} w='full' maxW={{ base: '320px', lg: '420px' }} direction='column' gap={4}>
                <ModalCloseButton />
                <Heading as="h2" textAlign="center" size="lg">
                    WELCOME
                </Heading>
                <Flex w='full' direction='column' align='center' gap={6}>
                    <Flex w='full' direction='column' align='center' gap={4}>
                        <Flex w='full' direction='column' gap={2}>
                            <Input placeholder="Email" p='1rem' bg='rgba(255, 255, 255, 0.15)' border='none' rounded='full' shadow='0 8px 32px 0 rgba(31, 38, 135, 0.37)' />
                            <Input type="password" placeholder="Password" p='1rem' bg='rgba(255, 255, 255, 0.15)' border='none' rounded='full' shadow='0 8px 32px 0 rgba(31, 38, 135, 0.37)' />
                        </Flex>
                        <Button w='80%'>
                            SIGN UP
                        </Button>
                    </Flex>
                    <Text>OR LOGIN WITH</Text>
                    <Box
                        w="90%"
                        h="0.3rem"
                        bg="linear-gradient(to bottom right, #a588e4, #b7fee0)"
                        rounded="0.8rem"
                    />
                    <HStack spaceX={6} justify='center'>
                        <SocialIcon network="facebook" />
                        <SocialIcon network="whatsapp" />
                        <SocialIcon network="x" />
                    </HStack>
                    <Text cursor="pointer">
                        FORGOT PASSWORD?
                    </Text>
                </Flex>
            </ModalContent>
        </Modal>
    )
}

export default LoginModal;
