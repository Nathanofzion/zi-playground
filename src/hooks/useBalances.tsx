
import { contractInvoke } from '@soroban-react/contracts';
import { SorobanContextType, } from '@soroban-react/core';
import { scValToBigInt, xdr } from '@stellar/stellar-sdk';

import { accountToScVal } from '@/utils';

export async function tokenBalance(
    tokenAddress: string,
    userAddress: string,
    sorobanContext: SorobanContextType,
) {
    const user = accountToScVal(userAddress);

    if (!tokenAddress) return 0;

    const response = await contractInvoke({
        contractAddress: tokenAddress,
        method: 'balance',
        args: [user],
        sorobanContext,
    });

    const decimals = await tokenDecimals(tokenAddress, sorobanContext);

    return Number(scValToBigInt(response as xdr.ScVal)) / Math.pow(10, decimals);
}

export async function tokenDecimals(tokenAddress: string, sorobanContext: SorobanContextType) {
    const response = await contractInvoke({
        contractAddress: tokenAddress,
        method: 'decimals',
        sorobanContext,
    });

    return Number(scValToBigInt(response as xdr.ScVal));
}
