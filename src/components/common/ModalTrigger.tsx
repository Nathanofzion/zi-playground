import { FC } from "react";

import { Dialog, DialogTriggerProps } from "@chakra-ui/react";

const ModalTrigger: FC<DialogTriggerProps> = (props) => {
  return <Dialog.Trigger {...props} />;
};

export default ModalTrigger;
