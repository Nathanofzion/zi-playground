import { styled, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import * as React from 'react';
import { ColorModeContext } from '../../contexts/context';
import { ModeSwitch } from './Header';
import ProfileSection from './ProfileSection';

const titleStyle = {
  display: 'flex',
  width: 'auto',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '24px',
  padding: '24px',
};

const TitleDiv = styled('div')`
  color: ${({ theme }) => theme.palette.primary.main};
  display: flex;
  width: 100%;
  font-family: Inter;
  font-size: 18px;
  font-weight: 500;
  line-height: 100%;
  align-items: center;
  justify-content: space-between;
`;

export default function MobileDrawer({ isDrawerOpen, setDrawerOpen }) {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  return (
    <Drawer
      anchor="top"
      open={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      sx={{
        '&.MuiDrawer-root': { zIndex: '1050' },
        '&.MuiDrawer-root .MuiDrawer-paper': {
          marginTop: '78px',
          bgcolor: theme.palette.background.default,
          backgroundImage: 'none',
        },
      }}
    >
      <Box sx={titleStyle} role="presentation">
        <TitleDiv>
          Connect a wallet
          <ModeSwitch
            sx={{ m: 1 }}
            defaultChecked={theme.palette.mode === 'dark' ? true : false}
            onChange={(e) => colorMode.toggleColorMode()}
          />
        </TitleDiv>
        <ProfileSection />
      </Box>
    </Drawer>
  );
}
