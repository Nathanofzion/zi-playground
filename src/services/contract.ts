import { accountToScVal } from "@/utils";
import { contractInvoke } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import { Asset } from "@stellar-asset-lists/sdk";
import { scValToNative } from "@stellar/stellar-sdk";

export async function tokenBalance(
  sorobanContext: SorobanContextType,
  tokenAddress: string,
  userAddress: string,
) {
  const user = accountToScVal(userAddress);

  if (!tokenAddress) return 0;

  try {
    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: 'balance',
      args: [user],
      sorobanContext,
    });

    const decimals = await tokenDecimals(sorobanContext, tokenAddress);

    return scValToNative(response as any) / Math.pow(10, decimals);
  } catch (err) {
    console.error(err);
    return 0;
  }
}

export async function tokenDecimals(sorobanContext: SorobanContextType, tokenAddress: string) {
  const response = await contractInvoke({
    contractAddress: tokenAddress,
    method: 'decimals',
    sorobanContext,
  });

  return scValToNative(response as any);
}

export const sendAsset = (sorobanContext: SorobanContextType, asset: Asset, recipient: string, amount: Number) => {

}
