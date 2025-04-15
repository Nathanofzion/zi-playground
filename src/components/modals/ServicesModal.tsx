import { FC, useContext } from "react";

import { Grid } from "@chakra-ui/react";

import { AppContext } from "@/providers";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import { ModalProps } from "../common/Modal";

const ServicesModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const {
    openSendModal,
    openReceiveModal,
    openSwapModal,
    openLiquidityModal,
    openBridgeModal,
    openInfoModal,
  } = useContext(AppContext);

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent
        left={{ base: "50%", lg: "75%" }}
        p="48px"
        w="full"
        maxW={{ base: "360px", lg: "480px" }}
      >
        <ModalCloseButton />
        <Grid w="full" templateColumns="repeat(2, minmax(0, 1fr))" gap="32px">
          <Button
            size="2xl"
            onClick={() => {
              openSendModal?.();
              onClose?.();
            }}
          >
            Send
          </Button>
          <Button
            size="2xl"
            onClick={() => {
              openReceiveModal?.();
              onClose?.();
            }}
          >
            Receive
          </Button>
          <Button
            size="2xl"
            onClick={() => {
              openSwapModal?.();
              onClose?.();
            }}
          >
            Swap
          </Button>
          <Button
            size="2xl"
            onClick={() => {
              openLiquidityModal?.();
              onClose?.();
            }}
          >
            Liquidity
          </Button>
          <Button
            size="2xl"
            onClick={() => {
              openBridgeModal?.();
              onClose?.();
            }}
          >
            Bridge
          </Button>
          <Button
            size="2xl"
            onClick={() => {
              openInfoModal?.();
              onClose?.();
            }}
          >
            Info
          </Button>
        </Grid>
      </ModalContent>
    </Modal>
  );
};

export default ServicesModal;
