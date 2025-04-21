import { FC, ReactNode } from "react";

import { Dialog, DialogRootProps } from "@chakra-ui/react";

export type ModalProps = DialogRootProps & {
  isOpen: boolean;
  onClose: () => void;
};

const Modal: FC<ModalProps> = ({ isOpen, onClose, ...props }) => {
  return (
    <Dialog.Root
      placement="center"
      open={isOpen}
      onOpenChange={(detail) => !detail.open && onClose()}
      {...props}
    />
  );
};

export default Modal;
