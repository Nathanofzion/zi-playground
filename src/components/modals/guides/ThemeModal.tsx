import { FC, useState } from "react";

import { Box, Flex, Text } from "@chakra-ui/react";

import { ModalCloseButton, ModalContent, ModalOverlay } from "@/components/common";
import GetAirdropButton from "@/components/common/GetAirdropButton";
import Modal, { ModalProps } from "@/components/common/Modal";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Action } from "@/hooks/useAirdrop";

const ThemeModal: FC<ModalProps> = (props) => {
  const [showButton, setShowButton] = useState(false);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        w="360px"
      >
        <ModalCloseButton />
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">
              Change theme
            </Text>
            <Text fontSize='sm'>
              Try to change theme and get your ZI airdrop
            </Text>
          </Flex>
          <Flex justify='center'>
            <Box onClick={() => setShowButton(true)}>
              <ColorModeButton guide />
            </Box>
          </Flex>
          {showButton && <GetAirdropButton action={Action.Theme} />}
        </Flex>
      </ModalContent>
    </Modal>
  )
}

export default ThemeModal;
