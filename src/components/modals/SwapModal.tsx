import { FC } from "react";

import { Heading } from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import AssetSelect from "../common/AssetSelect";
import { ModalProps } from "../common/Modal";

const SwapModal: FC<ModalProps> = (props) => {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          SWAP
        </Heading>
        <AssetSelect />
      </ModalContent>
    </Modal>
  );
};

export default SwapModal;
