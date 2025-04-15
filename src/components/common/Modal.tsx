import { FC, ReactNode } from "react";

import { Dialog, DialogRootProps } from "@chakra-ui/react";

export type ModalProps = Partial<DialogRootProps> & {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

const Modal: FC<ModalProps> = ({ isOpen, onClose, ...props }) => {
  return (
    <Dialog.Root
      children
      placement="center"
      open={isOpen}
      onOpenChange={(detail) => !detail.open && onClose()}
      {...props}
    />
  );
};

export default Modal;
