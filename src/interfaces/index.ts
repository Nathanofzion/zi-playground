export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum RewardType {
  INVITED = "INVITED",
  CLAIMED = "CLAIMED",
}

export interface IUser {
  id: string;
  publicKey: string;
  email: string;
  role: Role;
}

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

export interface IRewardsHistory {
  id: number;
  type: RewardType;
  amount: number;
  created_at: string;
}

export interface IRewards {
  referral_count: number;
  total_rewards: number;
  claimed_rewards: number;
  remaining_rewards: number;
  history: IRewardsHistory[];
}

export interface IRewardItem {
  id: number;
  users?: {
    email: string;
    publicKey: string;
  };
  amount: number;
  type: RewardType;
}
