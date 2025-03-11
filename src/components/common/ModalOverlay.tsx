import { Box, BoxProps } from "@chakra-ui/react";
import { FC, useContext, useEffect, useState } from "react";
import { ModalContext } from "./Modal";

const ModalOverlay: FC<BoxProps> = ({ ...props }) => {
    const { isOpen, onClose } = useContext(ModalContext);
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        setOpacity(isOpen ? 0.5 : 0);
    }, [isOpen]);

    return <Box
        position='fixed'
        inset={0}
        zIndex={1010}
        display={isOpen ? 'flex' : 'none'}
        bg='black'
        opacity={opacity}
        transition='opacity'
        onClick={onClose}
        {...props}
    />
}

export default ModalOverlay;
