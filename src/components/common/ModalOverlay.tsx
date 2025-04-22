import { FC } from "react";

import { Dialog, DialogBackdropProps } from "@chakra-ui/react";

const ModalOverlay: FC<DialogBackdropProps> = (props) => {
  return <Dialog.Backdrop {...props} />;
};

export default ModalOverlay;
