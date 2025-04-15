import { FC } from "react";
import { SocialIcon } from "react-social-icons";

import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";

const LoginModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        left={{ base: "50%", lg: "75%" }}
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          WELCOME
        </Heading>
        <Flex w="full" direction="column" align="center" gap={6}>
          <Flex w="full" direction="column" align="center" gap={4}>
            <Flex w="full" direction="column" gap={2}>
              <Input />
              <Input />
            </Flex>
            <Button w="80%">SIGN UP</Button>
          </Flex>
          <Text>OR LOGIN WITH</Text>
          <Box
            w="90%"
            h="0.3rem"
            bg="linear-gradient(to bottom right, #a588e4, #b7fee0)"
            rounded="0.8rem"
          />
          <HStack spaceX={6} justify="center">
            <SocialIcon network="facebook" />
            <SocialIcon network="whatsapp" />
            <SocialIcon network="x" />
          </HStack>
          <Text cursor="pointer">FORGOT PASSWORD?</Text>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
