import { FC, useContext, useMemo } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";

import { Action, Theme } from "@/enums";
import useAirdrop from "@/hooks/useAirdrop";
import { AppContext } from "@/providers";
import Button from "../Button";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    setTheme,
    openParticlesModal,
    openAtomicModal,
    openSpaceInvadersModal,
  } = useContext(AppContext);
  const { status } = useAirdrop();

  const canReceiveAirdrop = useMemo(() => {
    return !(status[Action.SpinCube].data
      && status[Action.Partices].data
      && status[Action.Theme].data);
  }, [status]);

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
              setTheme?.(Theme.Particle);
              if (canReceiveAirdrop) {
                openParticlesModal?.();
              }
              onClose?.();
            }}
          >
            Particles airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              setTheme?.(Theme.Atomic);
              openAtomicModal?.();
              onClose?.();
            }}
          >
            Atomic airdrop
          </Button>

          <Button
            size="xl"
            onClick={() => {
              setTheme?.(Theme.SpaceInvaders);
              openSpaceInvadersModal?.();
              onClose?.();
            }}
          >
            Space invaders
          </Button>

          <Button
            size="xl"
            onClick={() => {
              setTheme?.(Theme.NightDay);
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
