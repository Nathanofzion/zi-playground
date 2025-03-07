import { FC, useRef, useState } from "react";

import { Flex, Text } from "@chakra-ui/react";

import Button from "@/components/Button";
import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { MouseClickIcon } from "@/components/icons";
import useAirdrop, { Action } from "@/hooks/useAirdrop";

const ParticlesGuideModal: FC<ModalProps> = (props) => {
  const clickedRef = useRef(0);
  const [showButton, setShowButton] = useState(false);
  const { status } = useAirdrop();

  return (
    <GuideModal
      title="Create Some Particles"
      description="Create some Particles on the screen by Clicking Here."
      congratulation={
        <Text fontSize="sm">
          Amazing you’ve created some particles now check your balance and move
          to Step 4). to get your last particle theme Airdrop
        </Text>
      }
      action={Action.CreateParticles}
      showButton={showButton}
      {...props}
    >
      <Flex justify="center">
        <MouseClickIcon
          w="64px"
          h="64px"
          onClick={() => setShowButton(++clickedRef.current >= 3)}
        />
      </Flex>
      {status > 0 && <Button>Move to step 2</Button>}
    </GuideModal>
  );
};

export default ParticlesGuideModal;
