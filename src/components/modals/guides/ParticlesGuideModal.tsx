import { FC, useRef, useState } from "react";

import { Flex, Text } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { MouseClickIcon } from "@/components/icons";
import { Action } from "@/hooks/useAirdrop";

const ParticlesGuideModal: FC<ModalProps> = (props) => {
    const clickedRef = useRef(0);
    const [showButton, setShowButton] = useState(false);

    return (
        <GuideModal
            title="Click screen"
            description="Try to click screen to get your ZI airdrop"
            congratulation={
                <Text fontSize='sm'>
                    Amazing you’ve created some particles now check your balance and move to Step 4). to get your last particle theme Airdrop
                </Text>
            }
            action={Action.CreateParticles}
            showButton={showButton}
            {...props}
        >
            <Flex justify='center'>
                <MouseClickIcon w="64px" h="64px" onClick={() => setShowButton(++clickedRef.current >= 3)} />
            </Flex>
        </GuideModal>
    )
}

export default ParticlesGuideModal;
