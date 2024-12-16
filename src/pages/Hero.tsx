import { ButtonPrimary } from "@/components/buttons/Button";
import Earth from "@/components/Earth";
import { AppContext } from "@/contexts";
import { ColorMode, ColorModeContext } from "@/providers/ColorModeProvider";
import { Box, styled } from "@mui/material";
import { useContext, useState } from "react";

const Container = styled(Box)`
  height: 100%;
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  @media screen and (min-width: 1024px) {
    grid-template-rows: unset;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Hero = () => {
  const { ConnectWalletModal: { setConnectWalletModalOpen } } = useContext(AppContext);
  const { colorMode } = useContext(ColorModeContext);

  const [startAnimation, setStartAnimation] = useState(false);

  const handleConnect = () => {
    setConnectWalletModalOpen(true);
    setStartAnimation(true);
  }

  return (
    <Container>
      <Earth startAnimation={startAnimation} />
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        <h2 style={{ maxWidth: 560, zIndex: 10, textAlign: 'center', fontSize: 48, color: colorMode == ColorMode.DARK ? '#fff' : '#000' }}>
          Connect the World With Zig3
        </h2>
        <ButtonPrimary sx={{ width: 'unset' }} onClick={handleConnect}>
          Connect wallet
        </ButtonPrimary>
      </div>
    </Container>
  );
};

export default Hero;
