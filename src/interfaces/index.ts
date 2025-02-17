import { Asset } from '@stellar-asset-lists/sdk';

export * from './tokens';

export interface IWallet {
    id: string;
    name: string;
    sname?: string;
    iconUrl: string;
    isConnected: boolean;
}

export type AssetWithBalance = {
    balance?: number,
} & Asset;
