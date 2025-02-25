import { mainnet, standalone, testnet } from '@soroban-react/chains';

import { nativeTokens } from '@/constants';

export const chains = process.env.NODE_ENV === 'production' ? [testnet, mainnet] : [standalone, testnet, mainnet];
export const activeChainName = process.env.PUBLIC_STELLAR_NETWORK || 'testnet';
export const activeChain = chains.find((chain) => chain.id === activeChainName) || testnet;
export const nativeTokenAddress = nativeTokens.find((nativeToken) => nativeToken.network === activeChainName)!.address;
