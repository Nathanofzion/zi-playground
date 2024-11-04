import { Box, Switch, styled, useMediaQuery, useTheme } from '@mui/material';
import logo from '../../assets/logo.png';

import React from 'react';
import { Menu } from 'react-feather';
import { Link, useLocation } from 'react-router-dom';
import { ColorModeContext } from "../../contexts/context";
import { ActiveAirdropButton, AirdropButton } from '../buttons/Airdrop';
import { ButtonPrimary } from '../buttons/Button';
import ProfileSection from './ProfileSection';

const darkModeMoon = '/assets/darkModeMoon1.svg';
const lightModeSun = '/assets/lightModeSun1.svg';

const HeaderContainer = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 1100;
`

const MainBox = styled('div')`
  display: flex;
  width: 100%;
  padding: ${({ isMobile }) => (isMobile ? '24px 10px' : '24px 75px')};
  align-items: center;
  justify-content: space-between;
  gap: 40px;
`;

const BorderBox = styled('div')`
  height: 10px;
  background: linear-gradient(90deg,#a588e4,#b7fee0);
`

const NavBar = styled('div')`
  display: flex;
  height: 56px;
  padding: 8px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 32px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: 0px 4px 10px 0px rgba(136, 102, 221, 0.03);
`;

const NavBarMobile = styled('div')`
  display: flex;
  height: 48px;
  width: 100%;
  padding: 8px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 32px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: 0px 4px 10px 0px rgba(136, 102, 221, 0.03);
`;

const NavBarContainer = styled('div')`
  position: fixed;
  bottom: 1rem;
  display: flex;
  left: 50%;
  transform: translateX(-50%);
`;

const ButtonsBox = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavItem = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'active',
})`
  display: flex;
  padding: 4px 24px;
  align-items: center;
  gap: 10px;
  border-radius: 32px;
  background: ${({ active }) => (active ? '#00615F' : '')};
  text-align: center;
  color: ${({ theme, active }) => (active ? '#FFFFFF' : theme.palette.custom.textTertiary)};
  font-size: 20px;
  font-weight: 600;
  line-height: 140%;
  text-decoration: none;
`;

const NavItemMobile = styled('a', {
    shouldForwardProp: (prop) => prop !== 'active',
})`
  display: flex;
  padding: 8px 18px;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  background: ${({ active }) => (active ? '#00615F' : '')};
  text-align: center;
  color: ${({ theme, active }) => (active ? '#FFFFFF' : theme.palette.custom.textTertiary)};
  font-size: 16px;
  font-weight: 600;
  line-height: 100%;
  text-decoration: none;
`;

export const ModeSwitch = styled((props) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
    width: 100,
    height: 56,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 8,
        '&.Mui-checked': {
            transform: 'translateX(46px)',
            color: '#00615F',

            '& .MuiSwitch-thumb:before': {
                backgroundColor: '#00615F',
                borderRadius: 32,
                backgroundImage: `url(${darkModeMoon})`,
            },
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.background.paper,
                opacity: 1,
                border: 0,
            },
        },
    },
    '& .MuiSwitch-thumb': {

        backgroundColor: '#F88F6D',
        width: 40,
        height: 40,
        '&:before': {
            content: `''`,
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: `url(${lightModeSun})`,
        },
    },
    '& .MuiSwitch-track': {
        borderRadius: 32,
        backgroundColor: theme.palette.background.paper,
        opacity: 1,
    },
}));

export default function Header({ isDrawerOpen, setDrawerOpen, }) {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    const router = useLocation();
    const { pathname } = router;

    const isMobile = useMediaQuery(theme.breakpoints.down(1220));

    const logoWidth = isMobile ? 48 : 70;
    const logoHeight = isMobile ? 48 : 70;

    const navItems = [
        { href: '/balance', label: 'Balance', target: '_self' },
        { href: '/swap', label: 'Swap', target: '_self' },
        { href: '/liquidity', label: 'Liquidity', target: '_self' },
        { href: '/bridge', label: 'Bridge', target: '_self' },
        { href: 'https://info.soroswap.finance', label: 'Info', target: '_blank' },
    ];

    return (
        <HeaderContainer>
            <MainBox isMobile={isMobile} >
                <img
                    src={logo}
                    width={70}
                    height={70}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: logoWidth,
                        maxHeight: logoHeight,
                        minHeight: 30,
                        minWidth: 30,
                    }}
                    alt={'Soroswap'}
                />

                {!isMobile ? (
                    <>
                        <NavBar data-testid="nav">
                            {navItems.map((item) => (
                                <NavItem
                                    key={item.href}
                                    to={item.href}
                                    active={item.label === 'Swap' ? (pathname.includes(item.href) || pathname === '/') : pathname.includes(item.href)}
                                    target={item.target}
                                    data-testid="nav-link"
                                >
                                    {item.label}
                                </NavItem>
                            ))}
                        </NavBar>
                        <ButtonsBox>
                            <ModeSwitch
                                sx={{ m: 1 }}
                                defaultChecked={theme.palette.mode === 'dark' ? true : false}
                                onChange={(e) => colorMode.toggleColorMode()}
                            />
                            <ButtonPrimary style={{ width: '160px' }}>Testnet</ButtonPrimary>
                            <AirdropButton style={{ width: '105px' }} />
                            <ProfileSection />
                        </ButtonsBox>
                    </>
                ) : (
                    <>
                        <Box display="flex" alignItems="center" gap="18px" >
                            <ButtonPrimary style={{ width: '100px', height: 33, borderRadius: 4, fontSize: 14, overflow: 'hidden' }}>Testnet</ButtonPrimary>
                            <ActiveAirdropButton style={{ marginLeft: '8px' }} />
                            <Menu
                                onClick={() => setDrawerOpen(!isDrawerOpen)}
                                width={24}
                                height={24}
                                color={theme.palette.custom.borderColor}
                            />
                        </Box>
                        <NavBarContainer>
                            <NavBarMobile>
                                {navItems.map((item) => (
                                    <NavItemMobile
                                        key={item.href}
                                        href={item.href}
                                        active={item.label === 'Swap' ? (pathname.includes(item.href) || pathname === '/') : pathname.includes(item.href)}
                                    >
                                        {item.label}
                                    </NavItemMobile>
                                ))}
                            </NavBarMobile>
                        </NavBarContainer>
                    </>
                )}
            </MainBox>
            <BorderBox />
        </HeaderContainer>
    );
}
