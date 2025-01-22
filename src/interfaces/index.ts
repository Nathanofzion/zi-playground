export * from './tokens';

export interface IWallet {
    id: string;
    name: string;
    sname?: string;
    iconUrl: string;
    isConnected: boolean;
}
