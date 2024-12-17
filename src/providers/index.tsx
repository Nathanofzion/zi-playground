import { FC, ReactNode, useState } from "react";

import { AppContext } from "@/contexts";
import InkathonProvider from "@/providers/InkathonProvider";
import ColorModeProvider from "./ThemeProvider";
import MySorobanReactProvider from "./SorobanReactProvider";

interface Props {
    children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
    const [isConnectWalletModal, setConnectWalletModal] = useState(false);
    const [maxHops, setMaxHops] = useState(2);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarTitle, setSnackbarTitle] = useState("Swapped");
    const [snackbarType, setSnackbarType] = useState("SWAP");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const appContextValues = {
        ConnectWalletModal: {
            isConnectWalletModalOpen: isConnectWalletModal,
            setConnectWalletModalOpen: setConnectWalletModal,
        },
        SnackbarContext: {
            openSnackbar,
            snackbarMessage,
            snackbarTitle,
            snackbarType,
            setOpenSnackbar,
            setSnackbarMessage,
            setSnackbarTitle,
            setSnackbarType,
        },
        Settings: {
            maxHops,
            setMaxHops,
        },
    };

    return (
        <ColorModeProvider>
            <MySorobanReactProvider>
                <InkathonProvider>
                    <AppContext.Provider value={appContextValues}>
                        {children}
                    </AppContext.Provider>
                </ InkathonProvider>
            </MySorobanReactProvider>
        </ColorModeProvider>

    )
}

export default Provider;