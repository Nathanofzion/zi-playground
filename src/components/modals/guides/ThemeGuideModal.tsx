import { FC, useState } from "react";

import { Box, Flex } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Action } from "@/hooks/useAirdrop";

const ThemeGuideModal: FC<ModalProps> = (props) => {
    const [showButton, setShowButton] = useState(false);

    return (
        <GuideModal
            title="Change theme"
            description="Try to change theme and get your ZI airdrop"
            action={Action.ChangeTheme}
            showButton={showButton}
            {...props}
        >
            <Flex justify='center'>
                <Box onClick={() => setShowButton(true)}>
                    <ColorModeButton guide />
                </Box>
            </Flex>
        </GuideModal>
    )
}

export default ThemeGuideModal;
