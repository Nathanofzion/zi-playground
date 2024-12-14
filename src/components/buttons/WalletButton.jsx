import { ButtonLight, ButtonPrimary } from '../buttons/Button';
import { AppContext } from '@/contexts';
import React, { useContext } from 'react';


export function WalletButton({ style, light }) {
    const { ConnectWalletModal } = useContext(AppContext);
    const { isConnectWalletModalOpen, setConnectWalletModalOpen } = ConnectWalletModal;

    const handleClick = () => {
        setConnectWalletModalOpen(true);
    };

    const ButtonComponent = light ? ButtonLight : ButtonPrimary;

    return (
        <>
            <ButtonComponent style={style} onClick={handleClick}>
                Connect Wallet
            </ButtonComponent>
        </>
    );
}
