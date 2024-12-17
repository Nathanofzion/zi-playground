import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import Toolbar from '@mui/material/Toolbar';

import Header from "@/components/Layout/Header";
import MobileDrawer from "@/components/Layout/MobileDrawer";
import Hero from "@/pages/Hero";
import Balance from "@/pages/balance";
import { Box } from "@mui/material";
import BgParticles from "./components/BgParticles";
import ConnectWalletModal from "./components/Modals/ConnectWalletModal";

const App = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <Router>
      <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <BgParticles />
        <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          <Toolbar>
            <Header isDrawerOpen={isDrawerOpen} setDrawerOpen={setDrawerOpen} />
            <MobileDrawer isDrawerOpen={isDrawerOpen} setDrawerOpen={setDrawerOpen} />
          </Toolbar>
          <ConnectWalletModal />
          <Routes>
            <Route path='/' element={<Hero />} />
            <Route path='/balance' element={<Balance />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;
