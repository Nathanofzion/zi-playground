import React, { useState } from "react";
import BgParticles from "./components/BgParticles";
import Hero from "./pages/Hero";
import sun from "./assets/sun.svg";
import moon from "./assets/moon.svg";
import { AppContext, ColorModeContext } from "./contexts/context";
import { useMemo } from "react";
import Header from "./components/layouts/Header";
import { BrowserRouter } from "react-router-dom";
import { theme } from "./helpers/theme/theme"
import { ThemeProvider } from "@mui/material";
import MySorobanReactProvider from './soroban/MySorobanReactProvider';
import InkathonProvider from './inkathon/InkathonProvider';
import Toolbar from '@mui/material/Toolbar';
import ConnectWalletModal from "./components/modal/ConnectWalletModal";


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
                  </Toolbar>
                  <div>
                    <Hero isDarkMode={mode == 'dark'} />
                    <BgParticles isDarkMode={mode == 'dark'} />
                  </div>
                  <ConnectWalletModal />
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
