import { FC, useContext } from "react";

import { Flex, Heading } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAirdrop from "@/hooks/useAirdrop";
import { AppContext } from "@/providers";

import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    openParticlesGuideModal,
    openAtomicAirdropModal,
    openSpaceInvadersModal,
    openThemeGuideModal,
  } = useContext(AppContext);
  const { address } = useSorobanReact();
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
              openParticlesGuideModal?.();
              onClose?.();
            }}
            disabled={status > 0}
          >
            Particles airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openAtomicAirdropModal?.();
              onClose?.();
            }}
            // disabled={status > 1}
          >
            Atomic Airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openSpaceInvadersModal?.();
              onClose?.();
            }}
            disabled={status > 2}
          >
            Space invaders
          </Button>

          <Button
            size="xl"
            onClick={() => {
              openThemeGuideModal?.();
              onClose?.();
            }}
            disabled={status > 3}
          >
            Night & Day
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default AirdropModal;
