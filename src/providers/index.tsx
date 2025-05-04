"use client";
import { Signer } from "passkey-kit";
import { createContext, FC, ReactNode, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import AirdropModal from "@/components/modals/AirdropModal";
import BridgeModal from "@/components/modals/BridgeModal";
import {
  AtomicModal,
  ParticlesModal,
  SpaceInvadersModal,
} from "@/components/modals/guides";
import TetrisModal from "@/components/modals/guides/TetrisModal";
import InfoModal from "@/components/modals/InfoModal";
import LiquidityModal from "@/components/modals/LiquidityModal";
import LoginModal from "@/components/modals/LoginModal";
import ReceiveModal from "@/components/modals/ReceiveModal";
import RewardModal from "@/components/modals/RewardsModal";
import SendModal from "@/components/modals/SendModal";
import StakingModal from "@/components/modals/StakingModal";
import SwapModal from "@/components/modals/SwapModal";
import { Provider as ThemeProvider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { Theme } from "@/enums";
import SorobanReactProvider from "./SorobanReactProvider";

export interface IApp {
  theme: Theme;
  setTheme?: (theme: Theme) => void;
  signers: Signer[];
  setSigners?: (signers: Signer[]) => void;
  openLoginModal?: () => void;
  openSendModal?: () => void;
  openReceiveModal?: () => void;
  openSwapModal?: () => void;
  openLiquidityModal?: () => void;
  openBridgeModal?: () => void;
  openInfoModal?: () => void;
  openStakingModal?: () => void;
  openAirdropModal?: () => void;
  openParticlesModal?: () => void;
  openAtomicModal?: () => void;
  openSpaceInvadersModal?: () => void;
  openTetrisModal?: () => void;
  openRewardsModal?: () => void;
}

export const AppContext = createContext<IApp>({
  theme: Theme.Particle,
  signers: [],
});

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

const getTheme = () => {
  if (typeof window !== "undefined") {
    const theme = localStorage.getItem("airdrop-theme");
    if (theme) return theme as Theme;
  }
  return Theme.Particle;
};

const Provider: FC<Props> = ({ children }) => {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showParticlesModal, setShowParticlesModal] = useState(false);
  const [showAtomicModal, setShowAtomicModal] = useState(false);
  const [showSpaceInvadersModal, setShowSpaceInvadersModal] = useState(false);
  const [showTetrisModal, setShowTetrisModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme: (theme: Theme) => {
          setTheme(theme);
          if (typeof window !== "undefined") {
            localStorage.setItem("airdrop-theme", theme);
          }
        },
        signers,
        setSigners,
        openAirdropModal: () => setShowAirdropModal(true),
        openStakingModal: () => setShowStakingModal(true),
        openLoginModal: () => setShowLoginModal(true),
        openSendModal: () => setShowSendModal(true),
        openReceiveModal: () => setShowReceiveModal(true),
        openSwapModal: () => setShowSwapModal(true),
        openLiquidityModal: () => setShowLiquidityModal(true),
        openBridgeModal: () => setShowBridgeModal(true),
        openInfoModal: () => setShowInfoModal(true),
        openParticlesModal: () => setShowParticlesModal(true),
        openAtomicModal: () => setShowAtomicModal(true),
        openSpaceInvadersModal: () => setShowSpaceInvadersModal(true),
        openTetrisModal: () => setShowTetrisModal(true),
        openRewardsModal: () => setShowRewardsModal(true),
      }}
    >
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SorobanReactProvider>
            {children}
            <AirdropModal
              isOpen={showAirdropModal}
              onClose={() => setShowAirdropModal(false)}
            />
            <StakingModal
              isOpen={showStakingModal}
              onClose={() => setShowStakingModal(false)}
            />
            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
            />
            <SendModal
              isOpen={showSendModal}
              onClose={() => setShowSendModal(false)}
            />
            <ReceiveModal
              isOpen={showReceiveModal}
              onClose={() => setShowReceiveModal(false)}
            />
            <SwapModal
              isOpen={showSwapModal}
              onClose={() => setShowSwapModal(false)}
            />
            <LiquidityModal
              isOpen={showLiquidityModal}
              onClose={() => setShowLiquidityModal(false)}
            />
            <BridgeModal
              isOpen={showBridgeModal}
              onClose={() => setShowBridgeModal(false)}
            />
            <InfoModal
              isOpen={showInfoModal}
              onClose={() => setShowInfoModal(false)}
            />
            <ParticlesModal
              isOpen={showParticlesModal}
              onClose={() => setShowParticlesModal(false)}
            />
            <AtomicModal
              isOpen={showAtomicModal}
              onClose={() => setShowAtomicModal(false)}
            />
            <SpaceInvadersModal
              isOpen={showSpaceInvadersModal}
              onClose={() => setShowSpaceInvadersModal(false)}
            />
            <TetrisModal
              isOpen={showTetrisModal}
              onClose={() => setShowTetrisModal(false)}
            />
            <RewardModal
              isOpen={showRewardsModal}
              onClose={() => setShowRewardsModal(false)}
            />
          </SorobanReactProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <Toaster />
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export default Provider;
