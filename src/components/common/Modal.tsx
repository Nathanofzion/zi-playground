import { FC, ReactNode } from "react";

import { Dialog } from "@chakra-ui/react";

export interface ModalProps {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children, ...props }) => {
  return (
    <Dialog.Root
      placement="center"
      open={isOpen}
      onOpenChange={(detail) => !detail.open && onClose()}
      {...props}
    >
      {children}
    </Dialog.Root>
  );
};

export default Modal;
