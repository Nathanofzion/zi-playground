import { FC } from "react";

import { useSorobanReact } from "@soroban-react/core";
import { Connector } from "@soroban-react/types";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { WalletConnectButton } from "@/components/wallet";
import useWallets from "@/hooks/useWallets";
import { connect } from "@/lib/wallet";

const PasskeyGuideModal: FC<ModalProps> = ({ onClose, ...props }) => {
    const { connectors, setActiveConnectorAndConnect } = useSorobanReact();
    const wallets = useWallets();

    const handleConnect = async (connector: Connector) => {
        await connect(connector);
        setActiveConnectorAndConnect?.(connector);
        onClose?.();
    }

    return (
        <GuideModal title="Connect passkey" description="Try to connect your passkey and get your ZI airdrop" onClose={onClose} {...props}>
            {wallets.map((wallet, index) => {
                if (wallet.id == 'passkey') {
                    return (
                        <WalletConnectButton key={wallet.id} wallet={wallet} onClick={() => handleConnect(connectors[index])} />
                    )
                }
            })}
        </GuideModal>
    )
}

export default PasskeyGuideModal;
