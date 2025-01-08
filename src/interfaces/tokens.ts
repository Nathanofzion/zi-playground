export interface ITokenType {
    code: string;
    issuer?: string;
    contract: string;
    name?: string;
    org?: string;
    domain?: string;
    icon?: string;
    decimals?: number;
}

export interface ITokensResponse {
    network: string;
    tokens: ITokenType[];
}

export type ITokenTypeMap = {
    [key: string]: ITokenType;
};

export type ITokenBalancesMap = {
    [tokenAddress: string]: { usdValue: number; balance: string };
};
