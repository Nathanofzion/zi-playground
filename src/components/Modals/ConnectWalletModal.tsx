import { AppContext } from '@/contexts';
import Bowser from 'bowser';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AlertCircle } from 'react-feather';

import { isConnected as isConnectedLobstr } from '@lobstrco/signer-extension-api';
import { Box, CircularProgress, Modal, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useSorobanReact } from '@soroban-react/core';
import { Connector } from '@soroban-react/types';
import { isConnected } from '@stellar/freighter-api';

import { ButtonPrimary } from '@/components/Buttons/Button';
import ModalBox from './ModalBox';

const Title = styled('div')`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.custom.textPrimary};
`;
const Subtitle = styled('div')`
  font-size: 14px;
  font-weight: 500;
  &> span {
    display: block;
  }
  color: ${({ theme }) => theme.palette.custom.textPrimary};
`;

const Text = styled('div')`
  font-size: 12px;
  font-weight: 300;
  textwrap: wrap;
  &> span {
    display: block;
  }
`;
const Info = styled('div')`
  font-size: 10px;
  font-weight: 100;
  textwrap: wrap;
  &> span {
    display: block;
  }
`;

const ContentWrapper = styled('div') <{ isMobile: boolean }>`
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
  border-radius: 12px;
  padding: 16px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  color: ${({ theme }) => theme.palette.custom.textPrimary};
`;

const FooterText = styled('div') <{ isMobile: boolean }>`
  opacity: 0.5;
  font-size: 12px;
  font-weight: 600;
  text-align: ${({ isMobile }) => (isMobile ? 'center' : 'left')};
  &> span {
    color: ${({ theme }) => theme.palette.custom.textLinks};
  }
  color: ${({ theme }) => theme.palette.custom.textPrimary};
`;

export const ConnectWalletStyles = {
  Title,
  Subtitle,
  Text,
  Info,
  ContentWrapper,
  WalletBox,
  FooterText,
};

interface IWalletState {
  name: string;
  isInstalled: boolean;
  isLoading: boolean;
}

const ConnectWalletContent = ({
  isMobile,
  onError,
}: {
  isMobile: boolean;
  onError: any;
}) => {
  const theme = useTheme();
  const { ConnectWalletModal: { setConnectWalletModalOpen } } = useContext(AppContext);
  const { setActiveConnectorAndConnect, connectors: wallets } = useSorobanReact();
  const [walletStates, setWalletStates] = useState<IWalletState[]>([]);

  const updateWalletStates = useCallback(async () => {
    const walletStates = await Promise.all(wallets.map(async (wallet) => {
      let connected = false;
      if (wallet.id === 'freighter')
        connected = await isConnected();
      if (wallet.id === 'xbull' && (window as any).xBullSDK)
        connected = true;
      if (wallet.id === 'lobstr')
        connected = await isConnectedLobstr();
      if (wallet.id === 'passkey')
        connected = true;
      return { name: wallet.id, isInstalled: connected, isLoading: false };
    }));
    setWalletStates(walletStates);
  }, [wallets]);

  useEffect(() => {
    updateWalletStates();
  }, [updateWalletStates]);

  const browser = Bowser.getParser(window.navigator.userAgent).getBrowserName();

  const installWallet = (wallet: any) => {
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

  const connectWallet = async (wallet: Connector) => {
    try {
      setActiveConnectorAndConnect?.(wallet);
      setConnectWalletModalOpen(false);
    } catch (err: any) {
      console.error(err.message);
      const errorMessage = `${err}`;
      if (errorMessage.includes(`Error: Wallet hasn't been set upp`)) {
        onError(`Error: Wallet hasn't been set up. Please set up your xBull wallet.`);
      } else {
        onError('Something went wrong. Please try again.');
      }
    }
  };

  const handleClick = async (
    wallet: Connector,
    walletState: { name: string; isInstalled: boolean; isLoading: boolean } | undefined,
  ) => {
    if (!walletState || walletState.isLoading) return;

    if (!isMobile) {
      const isWalletInstalled = walletState.isInstalled;
      if (isWalletInstalled) {
        connectWallet(wallet);
      } else {
        installWallet(wallet);
      }
    } else if (isMobile) {
      connectWallet(wallet);
    }
  };

  return (
    <ModalBox>
      <ContentWrapper isMobile={isMobile}>
        <Title>Connect a wallet to continue</Title>
        <Subtitle>
          Choose how you want to connect.{' '}
          <span>If you don’t have a wallet, you can select a provider and create one.</span>
        </Subtitle>
        {wallets?.map((wallet, index) => {
          const walletState = walletStates.find((walletState) => walletState.name === wallet.id);
          return (
            <WalletBox key={index} onClick={() => handleClick(wallet, walletState)}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img alt={wallet.id} src={typeof wallet.iconUrl == 'string' ? wallet.iconUrl : ''} width={24} height={24} style={{ borderRadius: '4px' }} />
                <span>{wallet.name} Wallet</span>
              </div>
              {walletState ? (
                (walletState.isInstalled)
                  ? <span style={{ color: theme.palette.custom.textQuaternary }}>{walletState.name == 'passkey' ? 'Available' : 'Detected'}</span>
                  : <span style={{ color: theme.palette.error.main }}>Install</span>
              ) : <CircularProgress size={16} />}
            </WalletBox>
          );
        })}
      </ContentWrapper>
      <FooterText isMobile={isMobile}>
        By connecting a wallet, you agree to Soroswap <span>Terms of Service</span>
      </FooterText>
    </ModalBox>
  );
};

const ErrorContent = ({
  isMobile,
  handleClick,
  errorMessage,
}: {
  isMobile: boolean;
  handleClick: () => void;
  errorMessage: string;
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

export default function ConnectWalletModal() {
  const theme = useTheme();
  const { ConnectWalletModal } = useContext(AppContext);
  const { isConnectWalletModalOpen, setConnectWalletModalOpen } = ConnectWalletModal;

  const isMobile = useMediaQuery(theme.breakpoints.down(768));

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = (error: string) => {
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
            onError={handleError}
          />
        )}
      </div>
    </Modal>
  );
}
