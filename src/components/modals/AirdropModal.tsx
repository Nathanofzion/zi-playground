import { FC, useContext } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";

import { AppContext } from "@/providers";
import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    openParticlesModal,
    openAtomicModal,
    openSpaceInvadersModal,
    openThemeModal,
  } = useContext(AppContext);

  return (
    <Modal onClose={onClose} {...props}>
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
          Airdrops & Themes
        </Heading>
        <Text>
          Please select your Airdrop or theme from the buttons below.
        </Text>
        <Flex direction="column" gap={4}>
          <Button
            size="xl"
            onClick={() => {
              openParticlesModal?.();
              onClose?.();
            }}
          >
            Particles airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openAtomicModal?.();
              onClose?.();
            }}
          >
            Atomic Airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openSpaceInvadersModal?.();
              onClose?.();
            }}
          >
            Space invaders
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openThemeModal?.();
              onClose?.();
            }}
          >
            Night & Day
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default AirdropModal;
