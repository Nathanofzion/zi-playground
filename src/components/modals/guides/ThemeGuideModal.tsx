import { FC } from "react";

import { Flex } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { ColorModeButton } from "@/components/ui/color-mode";

const ThemeGuideModal: FC<ModalProps> = (props) => {
    return (
        <GuideModal title="Change theme" description="Try to change theme and get your ZI airdrop" {...props}>
            <Flex justify='center'>
                <ColorModeButton guide />
            </Flex>
        </GuideModal>
    )
}

export default ThemeGuideModal;
