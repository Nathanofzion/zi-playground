"use client"
import { createContext, FC, ReactNode, useState } from "react";

import AirdropModal from "@/components/modals/AirdropModal";
import { CubeGuideModal, ParticlesGuideModal, PasskeyGuideModal, ThemeGuideModal } from "@/components/modals/guides";
import LoginModal from "@/components/modals/LoginModal";
import StakingModal from "@/components/modals/StakingModal";
import { Provider as ThemeProvider } from "@/components/ui/provider";

import SorobanReactProvider from "./SorobanReactProvider";

interface IApp {
    startAnimation?: boolean;
    setStartAnimation?: (startAnimation: boolean) => void;
    openLoginModal?: () => void;
    openStakingModal?: () => void;
    openAirdropModal?: () => void;
    openParticlesGuideModal?: () => void;
}

export const AppContext = createContext<IApp>({});

interface Props {
    children: ReactNode;
}

const Provider: FC<Props> = ({ children }) => {
    const [startAnimation, setStartAnimation] = useState(false);
    const [showAirdropModal, setShowAirdropModal] = useState(false);
    const [showStakingModal, setShowStakingModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
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
            openParticlesGuideModal: () => setShowParticlesGuideModal(true),
        }}>
            <ThemeProvider>
                <SorobanReactProvider>
                    {children}
                    <AirdropModal isOpen={showAirdropModal} onClose={() => setShowAirdropModal(false)} />
                    <StakingModal isOpen={showStakingModal} onClose={() => setShowStakingModal(false)} />
                    <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
                    <PasskeyGuideModal isOpen={showPasskeyGuideModal} onClose={() => setShowPasskeyGuideModal(false)} />
                    <CubeGuideModal isOpen={showCubeGuideModal} onClose={() => setShowCubeGuideModal(false)} />
                    <ThemeGuideModal isOpen={showThemeGuideModal} onClose={() => setShowThemeGuideModal(false)} />
                    <ParticlesGuideModal isOpen={showParticlesGuideModal} onClose={() => setShowParticlesGuideModal(false)} />
                </SorobanReactProvider>
            </ThemeProvider>
        </AppContext.Provider>
    )
}

export default Provider;
