import { FC } from "react";

import { Dialog, DialogContentProps } from "@chakra-ui/react";

import { useColorModeValue } from "../ui/color-mode";

const ModalContent: FC<DialogContentProps> = (props) => {
  return (
    <Dialog.Positioner>
      <Dialog.Content
        bg={useColorModeValue(
          "linear-gradient(#F8F8F880, #F8F8F880) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;",
          "linear-gradient(#13141E80, #13141E80) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;"
        )}
        color={useColorModeValue("#00615F", "white")}
        shadow="0px 4px 10px 0px rgba(136, 102, 221, 0.1);"
        border="2px solid transparent"
        rounded="16px"
        {...props}
      />
    </Dialog.Positioner>
  );
};

export default ModalContent;
