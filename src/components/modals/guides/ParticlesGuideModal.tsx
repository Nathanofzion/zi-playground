import { FC } from "react";

import { Flex } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { MouseClickIcon } from "@/components/icons";

const ParticlesGuideModal: FC<ModalProps> = (props) => {
    return (
        <GuideModal title="Click screen" description="Try to click screen to get your ZI airdrop" {...props}>
            <Flex justify='center'>
                <MouseClickIcon w="64px" h="64px" color='white' />
            </Flex>
        </GuideModal>
    )
}

export default ParticlesGuideModal;
