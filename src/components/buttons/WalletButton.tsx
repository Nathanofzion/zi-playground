import React, { useContext } from 'react';

import { ButtonLight, ButtonPrimary } from '@/components/Buttons/Buttons';
import { AppContext } from '@/contexts';


export function WalletButton({ style, light }: { style?: React.CSSProperties; light?: boolean }) {
    const { ConnectWalletModal } = useContext(AppContext);
    const { setConnectWalletModalOpen } = ConnectWalletModal;

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
