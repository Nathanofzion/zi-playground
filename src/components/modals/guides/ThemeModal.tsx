import { FC, useState } from "react";

import { Box, Flex, Text } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Action } from "@/hooks/useAirdrop";

const ThemeModal: FC<ModalProps> = (props) => {
  const [showButton, setShowButton] = useState(false);

  return (
    <GuideModal
      title="Change theme"
      description="Try to change theme and get your ZI airdrop"
      congratulation={
        <Box>
          <Text fontSize='sm' fontWeight='bold'>
            Well done!!
          </Text>
          <Text mt={2} fontSize='sm'>
            You’ve now got the last Particle Theme Zi Airdrop.
          </Text>
          <Text mt={2} fontSize='sm'>
            Now invite your friends & family  by clicking the Rewards button & signing up.
          </Text>
          <Text fontSize='sm'>
            You will earn 10 Zi for everyone that clicks your link & receive the Zi Airdrop.
          </Text>
          <Text fontSize='sm'>
            You will get another 100 Zi for every 10 members that join via your link.
          </Text>
          <Text mt={2} fontSize='sm' fontWeight='bold'>
            Coming Soon
          </Text>
          <Text fontSize='sm'>
            And then;  if you want to earn even more Zi. Stake it to get 100% ARP on selected Smart contracts. Create Liquidity pools to earn 0.3% for everyone transaction within that pool Plus bonus.
          </Text>
        </Box>
      }
      action={Action.Theme}
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

export default ThemeModal;
