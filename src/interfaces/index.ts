export interface IWallet {
  id: string;
  name: string;
  sname?: string;
  iconUrl: string;
  isConnected: boolean;
  connect: () => Promise<void>;
}

export interface IAsset {
  id: string;
  name: string;
  code: string;
  issuer?: string;
  contract: string;
  org?: string;
  domain?: string;
  icon: string;
  decimals: number;
}

export interface IPair {
  id: number;
  contract: string;
  decimals: number;
  name: string;
  code: string;
  token_a: string;
  token_b: string;
}
