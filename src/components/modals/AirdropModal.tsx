import { FC, useContext, useMemo } from "react";

import { Flex, Heading, Text } from "@chakra-ui/react";

import { Action, Theme } from "@/enums";
import useAirdrop from "@/hooks/useAirdrop";
import { AppContext } from "@/providers/AppProvider";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";

const AirdropModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    setTheme,
    openParticlesModal,
    openAtomicModal,
    openSpaceInvadersModal,
    openTetrisModal,
  } = useContext(AppContext);
  const { status: particlesStatus } = useAirdrop();
  const { status: atomicStatus } = useAirdrop();

  const canReceiveParticlesAirdrop = useMemo(() => {
    return !(
      particlesStatus[Action.ParticleSpinCube].data &&
      particlesStatus[Action.ParticleParticles].data &&
      particlesStatus[Action.ParticleTheme].data
    );
  }, [particlesStatus]);

  const canReceiveAtomicAirdrop = useMemo(() => {
    return !(
      atomicStatus[Action.AtomicSpinCube].data &&
      atomicStatus[Action.AtomicAtoms].data &&
      atomicStatus[Action.AtomicTheme].data
    );
  }, [atomicStatus]);

  return (
    <Modal onClose={onClose} {...props}>
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
          Airdrops & Themes
        </Heading>
        <Text>Please select your Airdrop or theme from the buttons below.</Text>
        <Flex direction="column" gap={4}>
          <Button
            size="xl"
            onClick={() => {
              setTheme?.(Theme.Particle);
              if (canReceiveParticlesAirdrop) {
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
              if (canReceiveAtomicAirdrop) {
                setTheme?.(Theme.Atomic);
                openAtomicModal?.();
              }
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
              setTheme?.(Theme.Tetris);
              openTetrisModal?.();
              onClose?.();
            }}
          >
            Blockchain tetris
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
