import { FC, useContext } from "react";
import { CloseButton, CloseButtonProps } from "../ui/close-button";
import { ModalContext } from "./Modal";

const ModalCloseButton: FC<CloseButtonProps> = ({ ...props }) => {
    const { onClose } = useContext(ModalContext);

    return <CloseButton position='absolute' right={2} top={2} onClick={onClose} {...props} />
}

export default ModalCloseButton;
