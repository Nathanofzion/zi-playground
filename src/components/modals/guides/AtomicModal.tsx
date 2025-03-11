import { FC } from "react";

import { Flex, Text } from "@chakra-ui/react";

import { ModalCloseButton, ModalContent, ModalOverlay } from "@/components/common";
import { GradientCanvas } from "@/components/common/GradientCanvas";
import Modal, { ModalProps } from "@/components/common/Modal";

const AtomicModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        w="360px"
        h="360px"
      >
        <GradientCanvas
          position="absolute"
          w="full"
          h="full"
          zIndex={-5}
          rounded="16px"
          overflow="hidden"
        />
        <ModalCloseButton />
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">
              Atomic Airdrop
            </Text>
            <Text fontSize='sm'>
              Comming soon
            </Text>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default AtomicModal;
