import { Flex, FlexProps } from "@chakra-ui/react";
import { FC, useContext } from "react";
import { ModalContext } from "./Modal";

const ModalOverlay: FC<FlexProps> = ({ ...props }) => {
    const { onClose } = useContext(ModalContext);

    return <Flex position='fixed' inset={0} zIndex={1010} bg='#0004' onClick={onClose} {...props} />
}

export default ModalOverlay;
