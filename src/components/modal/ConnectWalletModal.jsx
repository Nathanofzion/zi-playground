import { isConnected as isConnectedLobstr } from '@lobstrco/signer-extension-api';
import { Box, CircularProgress, Modal, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useSorobanReact } from '@soroban-react/core';
import { isConnected } from '@stellar/freighter-api';
import base64url from 'base64url';
import Bowser from 'bowser';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import { AlertCircle } from 'react-feather';

import { account, getContractId } from '$lib/passkeyClient';
import { contractId } from '$lib/stores/contractId';
import { keyId } from '$lib/stores/keyId';
import freighterLogoBlack from '../../assets/FreighterWalletBlack.svg';
import freighterLogoWhite from '../../assets/FreighterWalletWhite.svg';
import { AppContext } from '../../contexts/context';
import { ButtonPrimary } from '../buttons/Button';
import ModalBox from './ModalBox';

const Title = styled('div')`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.custom.textPrimary};
`;

const Subtitle = styled('div')`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.custom.textPrimary};
  & > span {
    display: block;
  }
`;

const Text = styled('div')`
  font-size: 12px;
  font-weight: 300;
  textwrap: wrap;
  & > span {
    display: block;
  }
`;

const ContentWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: Inter;
  text-align: ${({ isMobile }) => (isMobile ? 'center' : 'left')};
`;

const WalletBox = styled('div')`
  cursor: pointer;
  display: flex;
  background-color: ${({ theme }) => theme.palette.customBackground.surface};
  color: ${({ theme }) => theme.palette.custom.textPrimary};
  border-radius: 12px;
  padding: 16px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  align-self: stretch;
`;

const FooterText = styled('div')`
  opacity: 0.5;
  font-size: 12px;
  font-weight: 600;
  text-align: ${({ isMobile }) => (isMobile ? 'center' : 'left')};
  color: ${({ theme }) => theme.palette.custom.textPrimary};
  & > span {
    color: ${({ theme }) => theme.palette.custom.textLinks};
  }
`;

const ConnectWalletContent = ({
    isMobile,
    wallets,
    onError,
}) => {
    const theme = useTheme();
    const { ConnectWalletModal } = useContext(AppContext);
    const { setConnectWalletModalOpen } = ConnectWalletModal;
    const sorobanContext = useSorobanReact();
    const { setActiveConnectorAndConnect } = sorobanContext;
    const [walletsStatus, setWalletsStatus] = useState([
        { name: 'freighter', isInstalled: false, isLoading: true },
        { name: 'xbull', isInstalled: false, isLoading: true },
        { name: 'lobstr', isInstalled: false, isLoading: true },
    ]);

    const browser = Bowser.getParser(window.navigator.userAgent).getBrowserName();

    const installWallet = (wallet) => {
        if (wallet.id === 'freighter') {
            switch (browser) {
                case 'Firefox':
                    window.open('https://addons.mozilla.org/en-US/firefox/addon/freighter/', '_blank');
                    break;
                default:
                    window.open(
                        'https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk',
                        '_blank',
                    );
                    break;
            }
        } else if (wallet.id === 'xbull') {
            switch (browser) {
                case 'Firefox':
                    window.open('https://addons.mozilla.org/es/firefox/addon/xbull-wallet/', '_blank');
                    break;
                default:
                    window.open(
                        'https://chromewebstore.google.com/detail/xbull-wallet/omajpeaffjgmlpmhbfdjepdejoemifpe',
                        '_blank',
                    );
                    break;
            }
        } else if (wallet.id === 'lobstr') {
            switch (browser) {
                default:
                    window.open(
                        'https://chromewebstore.google.com/detail/lobstr-signer-extension/ldiagbjmlmjiieclmdkagofdjcgodjle',
                        '_blank',
                    );
                    break;
            }
        }
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    };

    const connectWallet = async (wallet) => {
        const connect = setActiveConnectorAndConnect && setActiveConnectorAndConnect(wallet);
        try {
            await connect;
            setConnectWalletModalOpen(false);
        } catch (err) {
            const errorMessage = `${err}`;
            if (errorMessage.includes(`Error: Wallet hasn't been set upp`)) {
                onError(`Error: Wallet hasn't been set up. Please set up your xBull wallet.`);
            } else {
                onError('Something went wrong. Please try again.');
            }
        }
    };
    const handleClick = async (
        wallet,
        walletStatus,
    ) => {
        if (!walletStatus) return;
        if (walletStatus.isLoading) return;

        if (!isMobile) {
            const isWalletInstalled = walletStatus.isInstalled;
            if (isWalletInstalled) {
                connectWallet(wallet);
            } else {
                installWallet(wallet);
            }
        } else if (isMobile) {
            connectWallet(wallet);
        }
    };

    const handlePasskeyLogin = async () => {
        try {
            const { keyId: kid, contractId: cid } = await account.connectWallet({
                getContractId,
            });

            const keyId_base64url = base64url(kid);

            keyId.set(keyId_base64url);
            contractId.set(cid);
        } catch (err) {
            /* empty */
        }
    }

    useEffect(() => {
        const newWalletsStatus = walletsStatus.map(async (walletStatus) => {
            if (walletStatus.name === 'freighter') {
                const connected = await isConnected();
                return { name: walletStatus.name, isInstalled: connected, isLoading: false };
            }
            if (walletStatus.name === 'xbull') {
                if ((window).xBullSDK) {
                    return { name: walletStatus.name, isInstalled: true, isLoading: false };
                }
            }
            if (walletStatus.name === 'lobstr') {

                const connected = await isConnectedLobstr();

                return { name: walletStatus.name, isInstalled: connected, isLoading: false };
            }
            return { ...walletStatus, isLoading: false };
        });

        Promise.all(newWalletsStatus).then((updatedWalletsStatus) => {
            setWalletsStatus(updatedWalletsStatus);
        });
    }, [walletsStatus]);

    return (
        <ModalBox>
            <ContentWrapper isMobile={isMobile}>
                <Title>Connect a wallet to continue</Title>
                <Subtitle>
                    Choose how you want to connect.{' '}
                    <span>If you don&apos;t have a wallet, you can select a provider and create one.</span>
                </Subtitle>
                {wallets?.map((wallet, index) => {
                    const walletStatus = walletsStatus.find(
                        (walletStatus) => walletStatus.name === wallet.id,
                    );
                    let walletIconUrl = theme.palette.mode == 'dark'
                        ? freighterLogoWhite.src
                        : freighterLogoBlack.src
                    if (wallet.id == 'lobstr') {
                        walletIconUrl = 'https://stellar.creit.tech/wallet-icons/lobstr.svg'
                    }
                    else if (wallet.id == 'freighter') {
                        walletIconUrl = 'https://stellar.creit.tech/wallet-icons/freighter.svg'
                    }
                    else if (wallet.id == 'xbull') {
                        walletIconUrl = 'https://stellar.creit.tech/wallet-icons/xbull.svg'
                    }

                    return (
                        <WalletBox key={index} onClick={() => handleClick(wallet, walletStatus)}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <img
                                    src={walletIconUrl}
                                    width={24}
                                    height={24}
                                    alt={wallet.name + ' Wallet'}
                                />
                                <span>{wallet.name} Wallet</span>
                            </div>
                            {walletStatus?.isInstalled ? (
                                <span style={{ color: theme.palette.custom.textQuaternary }}>Detected</span>
                            ) : walletStatus?.isLoading ? (
                                <CircularProgress size={16} />
                            ) : (
                                <span style={{ color: theme.palette.error.main }}>Install</span>
                            )}
                        </WalletBox>
                    );
                })}
                <WalletBox onClick={handlePasskeyLogin}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <img
                            alt='passkey'
                            src='/img/img/passkey.png'
                            style={{ width: 24, height: 24, borderRadius: 6 }}
                        />
                        <span>PasskeyID Wallet</span>
                    </div>
                    <span style={{ color: theme.palette.custom.textQuaternary }}>Available</span>
                </WalletBox>
            </ContentWrapper>
            <FooterText isMobile={isMobile}>
                By connecting a wallet, you agree to Soroswap <span>Terms of Service</span>
            </FooterText>
        </ModalBox>
    );
};

ConnectWalletContent.propTypes = {
    isMobile: PropTypes.bool,
    wallets: PropTypes.array,
    onError: PropTypes.func,
}

const ErrorContent = ({
    isMobile,
    handleClick,
    errorMessage,
}) => {
    const theme = useTheme();
    return (
        <ModalBox>
            <ContentWrapper isMobile={isMobile}>
                <Box display="flex" alignItems="center" gap="16px">
                    <AlertCircle size="32px" stroke={theme.palette.customBackground.accentCritical} />
                    <Title>Connection Error</Title>
                </Box>
                <Box>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap="8px"
                        marginBottom="12px"
                    >
                        <Text style={{ textWrap: 'pretty' }}>{errorMessage}</Text>
                    </Box>
                    <ButtonPrimary onClick={handleClick} style={{ marginTop: 32 }}>
                        Try again
                    </ButtonPrimary>
                </Box>
            </ContentWrapper>
        </ModalBox>
    );
};

ErrorContent.propTypes = {
    isMobile: PropTypes.bool,
    handleClick: PropTypes.func,
    errorMessage: PropTypes.string,
}

export default function ConnectWalletModal() {
    const theme = useTheme();
    const sorobanContext = useSorobanReact();
    const supportedWallets = sorobanContext.connectors;
    const { ConnectWalletModal } = useContext(AppContext);
    const { isConnectWalletModalOpen, setConnectWalletModalOpen } = ConnectWalletModal;

    const isMobile = useMediaQuery(theme.breakpoints.down(768));

    const [errorMessage, setErrorMessage] = useState(null);

    const handleError = (error) => {
        setErrorMessage(error);
    };

    return (
        <Modal
            open={isConnectWalletModalOpen}
            onClose={() => {
                setConnectWalletModalOpen(false);
                setErrorMessage(null);
            }}
            aria-labelledby="modal-wallet-connect"
            aria-describedby="modal-wallet-disconnect"
        >
            <div>
                {errorMessage ? (
                    <ErrorContent
                        isMobile={isMobile}
                        handleClick={() => setErrorMessage(null)}
                        errorMessage={errorMessage}
                    />
                ) : (
                    <ConnectWalletContent
                        isMobile={isMobile}
                        wallets={supportedWallets}
                        onError={handleError}
                    />
                )}
            </div>
        </Modal>
    );
}
