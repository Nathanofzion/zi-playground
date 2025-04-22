import { FC } from "react";

import { Heading, Text } from "@chakra-ui/react";

import {
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@/components/common";
import Modal, { ModalProps } from "@/components/common/Modal";

const AtomicModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          Atomic airdrop
        </Heading>
        <Text textAlign="center">Coming soon...</Text>
      </ModalContent>
    </Modal>
  );
};

export default AtomicModal;
