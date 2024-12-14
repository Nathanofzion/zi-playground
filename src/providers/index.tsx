import { ThemeProvider } from "@mui/material";
import { FC, ReactNode, useState } from "react";

import { AppContext } from "@/contexts";
import { theme } from "@/helpers/theme/theme";
import InkathonProvider from "@/providers/InkathonProvider";
import MySorobanReactProvider from "./SorobanReactProvider";
import ColorModeProvider from "./ColorModeProvider";

interface Props {
    children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
    const [isConnectWalletModal, setConnectWalletModal] = useState(false);
    const [mode, setMode] = useState("dark");
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
        <ThemeProvider theme={theme(mode)}>
            <MySorobanReactProvider>
                <InkathonProvider>
                    <ColorModeProvider>
                        <AppContext.Provider value={appContextValues}>
                            {children}
                        </AppContext.Provider>
                    </ColorModeProvider>
                </ InkathonProvider>
            </MySorobanReactProvider>
        </ThemeProvider>
    )
}

export default Provider;