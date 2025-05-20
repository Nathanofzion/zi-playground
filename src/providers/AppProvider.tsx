"use client";
import { Signer } from "passkey-kit";
import { createContext, FC, ReactNode, useState } from "react";

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
import EmailRegistrationModal from "@/components/modals/EmailRegistrationModal";
import ReceiveModal from "@/components/modals/ReceiveModal";
import RewardModal from "@/components/modals/RewardsModal";
import SendModal from "@/components/modals/SendModal";
import StakingModal from "@/components/modals/StakingModal";
import SwapModal from "@/components/modals/SwapModal";
import { Provider as ThemeProvider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { Theme } from "@/enums";
import useUser from "@/hooks/useUser";
import { IUser } from "@/interfaces";

export interface IApp {
  theme: Theme;
  setTheme?: (theme: Theme) => void;
  user?: IUser;
  signers: Signer[];
  setSigners?: (signers: Signer[]) => void;
  token?: string | null;
  setToken?: (token: string) => void;
  openEmailRegistrationModal?: () => void;
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

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const Provider: FC<Props> = ({ children }) => {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [token, setToken] = useState<string | null>(getToken());
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [showEmailRegistrationModal, setShowEmailRegistrationModal] = useState(false);
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

  const { user } = useUser();

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
        user,
        signers,
        setSigners,
        token,
        setToken: (token: string) => {
          setToken(token);
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
          }
        },
        openAirdropModal: () => setShowAirdropModal(true),
        openStakingModal: () => setShowStakingModal(true),
        openEmailRegistrationModal: () => setShowEmailRegistrationModal(true),
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
        {children}
        <AirdropModal
          isOpen={showAirdropModal}
          onClose={() => setShowAirdropModal(false)}
        />
        <StakingModal
          isOpen={showStakingModal}
          onClose={() => setShowStakingModal(false)}
        />
        <EmailRegistrationModal
          isOpen={showEmailRegistrationModal}
          onClose={() => setShowEmailRegistrationModal(false)}
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
        <Toaster />
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export default Provider;
