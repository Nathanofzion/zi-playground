import { accountToScVal, scValToNumber } from "@/utils";
import { contractInvoke } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import { Asset } from "@stellar-asset-lists/sdk";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

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

    return scValToNumber(response as any) / Math.pow(10, decimals);
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

  return scValToNumber(response as any);
}

export const getAirdropStatus = async (sorobanContext: SorobanContextType, address: string) => {
  const response = await contractInvoke({
    contractAddress: airdropContractId,
    method: 'get_status',
    args: [accountToScVal(address)],
    sorobanContext,
  });
  return scValToNumber(response as any);
}

export const sendAsset = (
  sorobanContext: SorobanContextType,
  asset: Asset,
  recipient: string,
  amount: Number
) => {

}
