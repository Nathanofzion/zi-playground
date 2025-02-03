import { FC, useMemo } from "react";

import { useSorobanReact } from "@soroban-react/core";
import { Connector } from "@soroban-react/types";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { WalletConnectButton } from "@/components/wallet";
import useWallets from "@/hooks/useWallets";
import { connect } from "@/lib/wallet";
import { Text } from "@chakra-ui/react";

const PasskeyGuideModal: FC<ModalProps> = ({ onClose, ...props }) => {
    const { address, connectors, setActiveConnectorAndConnect } = useSorobanReact();
    const wallets = useWallets();

    const wallet = useMemo(() => wallets.find(wallet => wallet.id == 'passkey')!, [wallets]);
    const connector = useMemo(() => connectors[wallets.findIndex(wallet => wallet.id == 'passkey')]!, [connectors]);

    const handleConnect = async (connector: Connector) => {
        await connect(connector);
        setActiveConnectorAndConnect?.(connector);
    }

    return (
        <GuideModal
            title="Connect passkey"
            description="Try to connect your passkey and get your ZI airdrop"
            onClose={onClose}
            {...props}
        >
            {address ? (
                <Text fontSize='sm'>
                    Great you’ve Connected now move to Step 2).
                </Text>
            ) : (
                <WalletConnectButton wallet={wallet} onClick={() => handleConnect(connector)} />
            )}
        </GuideModal>
    )
}

export default PasskeyGuideModal;
