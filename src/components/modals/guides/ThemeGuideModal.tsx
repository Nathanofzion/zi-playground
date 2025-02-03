import { FC, useState } from "react";

import { Box, Flex, Text } from "@chakra-ui/react";

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
            congratulation={
                <Box>
                    <Text fontSize='sm'>
                        Superb welldone you now got the last particle theme airdrop, Now they you’ve done invite your friends and family earn 10 Zi for everyone that links your link & gets the airdrop.
                    </Text>
                    <Text fontSize='sm'>
                        And for every 10 people that user your link you’ll get an extra 100 Zi.
                    </Text>
                    <Text fontSize='sm'>
                        And then if you want to earn even more Zi Stake it and get 100% ARP and create liquidity pools to earn 0.3% for everyone transaction within that pool Plus bonus.
                    </Text>
                </Box>
            }
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
