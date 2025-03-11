import { FC } from "react";

import { Flex, Text } from "@chakra-ui/react";

import { ModalCloseButton, ModalContent, ModalOverlay } from "@/components/common";
import Modal, { ModalProps } from "@/components/common/Modal";

const SpaceInvadersModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        w="480px"
      >
        <ModalCloseButton />
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">
              Space invaders
            </Text>
            <Text fontSize='sm'>
              Comming soon
            </Text>
          </Flex>
          <iframe src="https://spaceinvaders.viperfish.com.au/" height={360} />
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default SpaceInvadersModal;
