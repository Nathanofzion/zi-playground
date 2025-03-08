import { FC, useContext } from "react";

import { Flex, Heading } from "@chakra-ui/react";

import useAirdrop, { Action } from "@/hooks/useAirdrop";
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
  const { status } = useAirdrop();

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
          AIRDROP
        </Heading>
        <Flex direction="column" gap={4}>
          <Button
            size="xl"
            onClick={() => {
              openParticlesModal?.();
              onClose?.();
            }}
            disabled={status[Action.Partices].data}
          >
            Particles airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openAtomicModal?.();
              onClose?.();
            }}
            disabled={status[Action.Atomic].data}
          >
            Atomic Airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openSpaceInvadersModal?.();
              onClose?.();
            }}
            disabled={status[Action.SpaceInvaders].data}
          >
            Space invaders
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openThemeModal?.();
              onClose?.();
            }}
            disabled={status[Action.Theme].data}
          >
            Night & Day
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default AirdropModal;
