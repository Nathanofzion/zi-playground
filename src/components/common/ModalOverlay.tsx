import { Box, BoxProps } from "@chakra-ui/react";
import { FC, useContext } from "react";
import { ModalContext } from "./Modal";

const ModalOverlay: FC<BoxProps> = ({ ...props }) => {
    const { isOpen, onClose } = useContext(ModalContext);

    return <Box
        position='fixed'
        inset={0}
        zIndex={1010}
        display={isOpen ? 'flex' : 'none'}
        bg='#0004'
        onClick={onClose}
        {...props}
    />
}

export default ModalOverlay;
