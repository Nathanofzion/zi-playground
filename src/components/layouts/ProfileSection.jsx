import { ArrowDropDownSharp, LinkOff } from '@mui/icons-material';
import { Box, Chip, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useInkathon } from '@scio-labs/use-inkathon';
import { useSorobanReact } from '@soroban-react/core';
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/context';
import { shortenAddress } from '../../helpers/address';
import { WalletButton } from '../buttons/WalletButton';

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        color:
            theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '0 0',
        },
        '& .MuiMenuItem-root': {
            backgroundColor: theme.palette.background.default,
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
            ':hover': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.hoverOpacity,
                ),
            },
        },
    },
}));

export const HeaderChip = ({
    label,
    onClick,
    isSmall,
    chains,
    canDisconnect,
    disconnect,
    ...rest
}) => {
    const theme = useTheme();
    const sorobanReact = useSorobanReact();
    const inkathon = useInkathon();
    const { setActiveChain } = sorobanReact;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleDropdownClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeActiveChain = (chain) => {
        setActiveChain && setActiveChain(chain);
        handleClose();
    }

    const handleDisconnect = () => {
        if (!disconnect) {
            sorobanReact.disconnect();
            inkathon.disconnect();
        } else {
            disconnect()
        }
    }

    const profileChipStyle = {
        display: 'flex',
        flexDirection: 'row',
        height: isSmall ? 30 : 56,
        padding: isSmall && canDisconnect ? '8px 1px 16px 1px' : isSmall ? '8px 16px' : '16px 24px',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0.5,
        flexShrink: 0,
        borderRadius: isSmall ? '4px' : '16px',
        backgroundColor: '#00615F',
        '&[aria-controls="menu-list-grow"], &:hover': {
            color: theme.palette.primary.light,
            '& svg': {
                stroke: theme.palette.primary.light,
            },
        },
        '& .MuiChip-label': {
            color: '#FFFFFF',
            fontSize: isSmall ? 14 : 20,
            fontFamily: 'Inter',
            fontWeight: 600,
            padding: 0
        },
        ':hover': {
            backgroundColor: '#00615F',
        },
        '.MuiChip-action-icon': {
            position: 'relative',
            top: isSmall ? '7px' : '5px',
            left: '5px'
        }
    }
    return (
        <>
            {chains ?
                (
                    <>
                        <Chip
                            onClick={handleDropdownClick}
                            sx={profileChipStyle}
                            label={label}
                            {...rest}
                        />

                        <StyledMenu
                            id="demo-positioned-menu"
                            aria-labelledby="demo-positioned-button"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'center',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'center',
                            }}
                        >
                            {chains?.map((chain) => (
                                <MenuItem key={chain.id} onClick={() => changeActiveChain(chain)}>{chain.name}</MenuItem>
                            ))
                            }
                        </StyledMenu>
                    </>)
                :
                (<>
                    <StyledMenu
                        id="account-menu"
                        aria-labelledby="account-button"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <MenuItem onClick={handleDisconnect} style={{ justifyContent: 'center' }}><LinkOff /> Disconnect</MenuItem>
                    </StyledMenu>
                </>
                )
            }
        </>
    );
};

export const ActiveChainHeaderChip = ({ isMobile }) => {
    const sorobanContext = useSorobanReact();
    const { activeChain, chains, activeConnector, address } = sorobanContext;

    return (
        <>
            {activeChain && chains && activeConnector?.id == 'xbull' && address ?
                <HeaderChip label={[activeChain?.name, <ArrowDropDownSharp key={'action-icon'} className='MuiChip-action-icon' />]} isSmall={isMobile} chains={chains} />
                :
                <HeaderChip label={activeChain?.name} isSmall={isMobile} />
            }
        </>
    );
};

export default function ProfileSection() {
    const { ConnectWalletModal } = useContext(AppContext);
    const sorobanContext = useSorobanReact();
    const theme = useTheme();
    const { setConnectWalletModalOpen } = ConnectWalletModal;
    const isMobile = useMediaQuery(theme.breakpoints.down(1220));

    const handleClick = () => {
        setConnectWalletModalOpen(true);
    };

    return (
        <Box display="flex" gap="8px">
            {(sorobanContext.address ? (
                <HeaderChip
                    label={
                        <div>{shortenAddress(sorobanContext.address ?? '')} <ArrowDropDownSharp className='MuiChip-action-icon' /></div>
                    }
                    onClick={() => { console.log('Current address: ' + sorobanContext.address) }}
                    isSmall={isMobile}
                    canDisconnect
                />
            ) : (
                <WalletButton style={{ whiteSpace: 'nowrap', overflow: 'hidden', paddingLeft: '40px', paddingRight: '40px', textOverflow: 'ellipsis', borderRadius: '16px' }} />
            ))}
        </Box>
    );
}
