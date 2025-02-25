"use client"
import { createContext, FC, ReactNode, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import AirdropModal from "@/components/modals/AirdropModal";
import BridgeModal from "@/components/modals/BridgeModal";
import { CubeGuideModal, ParticlesGuideModal, PasskeyGuideModal, ThemeGuideModal } from "@/components/modals/guides";
import InfoModal from "@/components/modals/InfoModal";
import LiquidityModal from "@/components/modals/LiquidityModal";
import LoginModal from "@/components/modals/LoginModal";
import ReceiveModal from "@/components/modals/ReceiveModal";
import SendModal from "@/components/modals/SendModal";
import StakingModal from "@/components/modals/StakingModal";
import SwapModal from "@/components/modals/SwapModal";
import { Provider as ThemeProvider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";

import SorobanReactProvider from "./SorobanReactProvider";

interface IApp {
    startAnimation?: boolean;
    setStartAnimation?: (startAnimation: boolean) => void;
    openLoginModal?: () => void;
    openSendModal?: () => void;
    openReceiveModal?: () => void;
    openSwapModal?: () => void;
    openLiquidityModal?: () => void;
    openBridgeModal?: () => void;
    openInfoModal?: () => void;
    openStakingModal?: () => void;
    openAirdropModal?: () => void;
    openPasskeyGuideModal?: () => void;
    openCubeGuideModal?: () => void;
    openThemeGuideModal?: () => void;
    openParticlesGuideModal?: () => void;
}

export const AppContext = createContext<IApp>({});

const queryClient = new QueryClient();

interface Props {
    children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
    const [startAnimation, setStartAnimation] = useState(false);
    const [showAirdropModal, setShowAirdropModal] = useState(false);
    const [showStakingModal, setShowStakingModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showLiquidityModal, setShowLiquidityModal] = useState(false);
    const [showBridgeModal, setShowBridgeModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showPasskeyGuideModal, setShowPasskeyGuideModal] = useState(false);
    const [showCubeGuideModal, setShowCubeGuideModal] = useState(false);
    const [showThemeGuideModal, setShowThemeGuideModal] = useState(false);
    const [showParticlesGuideModal, setShowParticlesGuideModal] = useState(false);

    return (
        <AppContext.Provider value={{
            startAnimation,
            setStartAnimation,
            openAirdropModal: () => setShowAirdropModal(true),
            openStakingModal: () => setShowStakingModal(true),
            openLoginModal: () => setShowLoginModal(true),
            openSendModal: () => setShowSendModal(true),
            openReceiveModal: () => setShowReceiveModal(true),
            openSwapModal: () => setShowSwapModal(true),
            openLiquidityModal: () => setShowLiquidityModal(true),
            openBridgeModal: () => setShowBridgeModal(true),
            openInfoModal: () => setShowInfoModal(true),
            openPasskeyGuideModal: () => setShowPasskeyGuideModal(true),
            openCubeGuideModal: () => setShowCubeGuideModal(true),
            openThemeGuideModal: () => setShowThemeGuideModal(true),
            openParticlesGuideModal: () => setShowParticlesGuideModal(true),
        }}>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <SorobanReactProvider>
                        {children}
                        <AirdropModal isOpen={showAirdropModal} onClose={() => setShowAirdropModal(false)} />
                        <StakingModal isOpen={showStakingModal} onClose={() => setShowStakingModal(false)} />
                        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
                        {showSendModal && <SendModal isOpen={true} onClose={() => setShowSendModal(false)} />}
                        <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
                        <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} />
                        <LiquidityModal isOpen={showLiquidityModal} onClose={() => setShowLiquidityModal(false)} />
                        <BridgeModal isOpen={showBridgeModal} onClose={() => setShowBridgeModal(false)} />
                        <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
                        <PasskeyGuideModal isOpen={showPasskeyGuideModal} onClose={() => setShowPasskeyGuideModal(false)} />
                        <CubeGuideModal isOpen={showCubeGuideModal} onClose={() => setShowCubeGuideModal(false)} />
                        <ThemeGuideModal isOpen={showThemeGuideModal} onClose={() => setShowThemeGuideModal(false)} />
                        <ParticlesGuideModal isOpen={showParticlesGuideModal} onClose={() => setShowParticlesGuideModal(false)} />
                    </SorobanReactProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
                <Toaster />
            </ThemeProvider>
        </AppContext.Provider>
    )
}

export default Provider;
