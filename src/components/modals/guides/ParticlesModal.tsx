import { FC, useContext, useRef, useState } from "react";

import { Flex, Text } from "@chakra-ui/react";

import Button from "@/components/Button";
import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { MouseClickIcon } from "@/components/icons";
import useAirdrop, { Action } from "@/hooks/useAirdrop";
import { AppContext } from "@/providers";

const ParticlesModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const { openAtomicModal } = useContext(AppContext);
  const { status } = useAirdrop();
  const clickedRef = useRef(0);
  const [showButton, setShowButton] = useState(false);

  return (
    <GuideModal
      title="Create Some Particles"
      description="Create some Particles on the screen by Clicking Here."
      congratulation={
        <Text fontSize="sm">
          Amazing you’ve created some particles now check your balance and move to Step 4). to get your last particle theme Airdrop
        </Text>
      }
      action={Action.Partices}
      showButton={showButton}
      onClose={onClose}
      {...props}
    >
      <Flex justify="center">
        <MouseClickIcon
          w="64px"
          h="64px"
          onClick={() => setShowButton(++clickedRef.current >= 3)}
        />
      </Flex>
      {status[Action.Partices].data && (
        <Button onClick={() => {
          openAtomicModal?.();
          onClose?.();
        }}>
          Move to step 2
        </Button>
      )}
    </GuideModal>
  );
};

export default ParticlesModal;
