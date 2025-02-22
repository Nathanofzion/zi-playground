import { contractInvoke } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import { Asset } from "@stellar-asset-lists/sdk";
import { nativeToScVal } from "@stellar/stellar-sdk";

import { accountToScVal, scValToNumber } from "@/utils";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

export async function tokenBalance(
  sorobanContext: SorobanContextType,
  tokenAddress: string,
) {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  const response = await contractInvoke({
    contractAddress: tokenAddress,
    method: 'balance',
    args: [accountToScVal(address)],
    sorobanContext,
  });

  return scValToNumber(response as any);
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

export const sendAsset = async (
  sorobanContext: SorobanContextType,
  asset: Asset,
  recipient: string,
  amount: number
) => {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  const response = await contractInvoke({
    contractAddress: asset.contract,
    method: 'transfer',
    args: [
      accountToScVal(address),
      accountToScVal(recipient),
      nativeToScVal(amount * Math.pow(10, asset.decimals), { type: 'i128' })
    ],
    sorobanContext,
    signAndSend: true,
    reconnectAfterTx: false,
  });

  return response;
}
