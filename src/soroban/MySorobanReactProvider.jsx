import React from 'react';
import { standalone, testnet, mainnet } from '@soroban-react/chains';
import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { lobstr } from '@soroban-react/lobstr';
import { xbull } from '@soroban-react/xbull';
// import { ChainMetadata, Connector, WalletChain } from '@soroban-react/types';
import useMounted from '../hooks/useMounted';

// Set allowed chains:
const chains =
import.meta.env.NODE_ENV === 'production' ? [testnet, mainnet] : [standalone, testnet, mainnet];

// Set chain by default:
// Helper function
const findWalletChainByName = (name) => {
  return chains.find((chain) => chain.id === name);
};

// Get the active chain based on the environment variable or default to testnet
const activeChainName = import.meta.env.PUBLIC_STELLAR_NETWORK || 'testnet';
const activeChain = findWalletChainByName(activeChainName) || testnet;

// Set allowed connectors
const connectors = [freighter(), xbull(), lobstr()];

export default function MySorobanReactProvider({ children }  ) {
  const mounted = useMounted();

  if (!mounted) return null;

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
