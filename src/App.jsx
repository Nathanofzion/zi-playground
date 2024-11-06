import { ThemeProvider } from "@mui/material";
import Toolbar from '@mui/material/Toolbar';
// eslint-disable-next-line no-unused-vars
import React, { useMemo, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import BgParticles from "./components/BgParticles";
import Header from "./components/layouts/Header";
import MobileDrawer from "./components/layouts/MobileDrawer";
import ConnectWalletModal from "./components/modal/ConnectWalletModal";
import { AppContext, ColorModeContext } from "./contexts/context";
import { theme } from "./helpers/theme/theme";
import InkathonProvider from './inkathon/InkathonProvider';
import Hero from "./pages/Hero";
import MySorobanReactProvider from './soroban/MySorobanReactProvider';


const App = () => {
  const [isConnectWalletModal, setConnectWalletModal] = useState(false);

  const [maxHops, setMaxHops] = useState(2);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarTitle, setSnackbarTitle] = useState('Swapped');
  const [snackbarType, setSnackbarType] = useState('SWAP');


  const [mode, setMode] = useState('dark');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

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
    <>
      <BrowserRouter>
        <ThemeProvider theme={theme(mode)}>
          <MySorobanReactProvider>
            <InkathonProvider>
              <ColorModeContext.Provider value={colorMode}>
                <AppContext.Provider value={appContextValues}>
                  <Toolbar>
                    <Header isDrawerOpen={openSnackbar} setDrawerOpen={setOpenSnackbar} />
                    <MobileDrawer isDrawerOpen={openSnackbar} setDrawerOpen={setOpenSnackbar} />
                  </Toolbar>
                  <ConnectWalletModal />
                  <div style={{ flexGrow: 1 }}>
                    <BgParticles isDarkMode={mode == 'dark'} />
                    <Hero isDarkMode={mode == 'dark'} />
                  </div>
                </AppContext.Provider>
              </ColorModeContext.Provider>
            </ InkathonProvider>
          </MySorobanReactProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
