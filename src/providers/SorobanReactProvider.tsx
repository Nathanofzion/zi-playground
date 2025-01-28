import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { lobstr } from '@soroban-react/lobstr';
import { ReactNode } from 'react';

import { activeChain, chains } from '@/lib/chain';
import passkey from '@/lib/passkey';

const connectors = [passkey(), freighter(), lobstr()];

interface Props {
    children: ReactNode;
}

export default function ({ children }: Props) {
    return (
        <SorobanReactProvider
            chains={chains}
            appName={'Soroswap'}
            connectors={connectors}
            activeChain={activeChain}
        >
            {children}
        </SorobanReactProvider>
    );
}
