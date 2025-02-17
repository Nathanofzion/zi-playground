import { contractInvoke } from '@soroban-react/contracts';
import { SorobanContextType, } from '@soroban-react/core';
import { scValToBigInt, xdr } from '@stellar/stellar-sdk';

import { accountToScVal } from '@/utils';

const ziAirdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

export async function tokenBalance(
    tokenAddress: string,
    userAddress: string,
    sorobanContext: SorobanContextType,
) {
    const user = accountToScVal(userAddress);

    if (!tokenAddress) return 0;

    try {
        const response = await contractInvoke({
            contractAddress: tokenAddress,
            method: tokenAddress == ziAirdropContractId ? 'get_balance' : 'balance',
            args: [user],
            sorobanContext,
        });

        const decimals = await tokenDecimals(tokenAddress, sorobanContext);

        return Number(scValToBigInt(response as xdr.ScVal)) / Math.pow(10, decimals);
    } catch (err) {
        console.error(err);
        return 0;
    }
}

export async function tokenDecimals(tokenAddress: string, sorobanContext: SorobanContextType) {
    const response = await contractInvoke({
        contractAddress: tokenAddress,
        method: 'decimals',
        sorobanContext,
    });

    return Number(scValToBigInt(response as xdr.ScVal));
}
