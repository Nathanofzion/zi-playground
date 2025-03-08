import { FC, ReactNode } from "react";

import { Flex, FlexProps, Text } from "@chakra-ui/react";

import { Action } from "@/hooks/useAirdrop";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from ".";
import GetAirdropButton from "./GetAirdropButton";
import { GradientCanvas } from "./GradientCanvas";
import { ModalProps } from "./Modal";

interface Props extends ModalProps {
  title: string;
  description: string;
  congratulation?: ReactNode;
  action: Action;
  showButton?: boolean;
  showGradientBackground?: boolean;
  _modalContent?: FlexProps;
}

const GuideModal: FC<Props> = ({
  title,
  description,
  children,
  action,
  showButton,
  showGradientBackground,
  _modalContent,
  ...props
}) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        w="360px"
        minH={showGradientBackground ? "360px" : undefined}
        {..._modalContent}
      >
        {showGradientBackground && (
          <GradientCanvas
            position="absolute"
            w="full"
            h="full"
            zIndex={-5}
            rounded="16px"
            overflow="hidden"
          />
        )}
        <Flex w="full" p={4} direction="column" gap={2} overflow="hidden">
          <ModalCloseButton />
          <Flex direction="column" gap={1}>
            <Text fontSize="xl">{title}</Text>
            <Text fontSize="sm">{description}</Text>
          </Flex>
          {children}
          {showButton && <GetAirdropButton action={action} />}
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default GuideModal;
