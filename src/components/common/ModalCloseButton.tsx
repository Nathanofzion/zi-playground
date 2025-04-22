import { FC } from "react";

import { Dialog, DialogCloseTriggerProps } from "@chakra-ui/react";

import { CloseButton } from "../ui/close-button";

const ModalCloseButton: FC<DialogCloseTriggerProps> = (props) => {
  return (
    <Dialog.CloseTrigger position="absolute" right={4} top={4} {...props}>
      <CloseButton size="sm" />
    </Dialog.CloseTrigger>
  );
};

export default ModalCloseButton;
