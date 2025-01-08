'use client';
import { createContext, FC, ReactNode, useState } from "react";

export interface ModalProps {
    children?: ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

interface IModal {
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}

export const ModalContext = createContext<IModal>({});

const Modal: FC<ModalProps> = ({ children, isOpen, onClose }) => {
    const [show, setShow] = useState(false);

    return (
        <ModalContext.Provider value={{
            isOpen: isOpen || show,
            onOpen: () => setShow(true),
            onClose: () => {
                setShow(false);
                onClose?.();
            }
        }}>
            {isOpen && children}
        </ModalContext.Provider>
    )
}

export default Modal;
