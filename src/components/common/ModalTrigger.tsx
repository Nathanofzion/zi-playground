import { Children, FC, ReactElement, ReactNode, cloneElement, isValidElement, useContext } from "react";
import { ModalContext } from "./Modal";

interface Props {
    children: ReactNode;
}

const ModalTrigger: FC<Props> = ({ children }) => {
    const { onOpen } = useContext(ModalContext);

    const renderChildren = () => {
        return Children.map(children, (child) => {
            if (isValidElement(child)) {
                return cloneElement(child as ReactElement<any>, { onClick: onOpen });
            }
            return child;
        });
    };

    return <>{renderChildren()}</>;
};

export default ModalTrigger;
