export interface IWallet {
  id: string;
  name: string;
  sname?: string;
  iconUrl: string;
  isConnected: boolean;
  connect: () => Promise<void>;
}

export interface IAsset {
  name: string;
  code: string;
  issuer?: string;
  contract: string;
  org?: string;
  domain?: string;
  icon: string;
  decimals: number;
}
