'use client';
import passkey from '@/lib/passkey';
import { mainnet, standalone, testnet } from '@soroban-react/chains';
import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { lobstr } from '@soroban-react/lobstr';
import { ReactNode } from 'react';

const chains = process.env.NODE_ENV === 'production' ? [testnet, mainnet] : [standalone, testnet, mainnet];

const activeChainName = process.env.PUBLIC_STELLAR_NETWORK || 'testnet';
const activeChain = chains.find((chain) => chain.id === activeChainName) || testnet;

const connectors = [passkey(), freighter(), lobstr()];

export default function ({ children }: { children: ReactNode }) {
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
