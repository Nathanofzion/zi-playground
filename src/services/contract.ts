import { SorobanContextType } from "@soroban-react/core";
import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

import { IAsset } from "@/interfaces";
import { contractInvoke } from "@/lib/contract-fe";
import { accountToScVal, scValToNumber } from "@/utils";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

export async function tokenBalance(
  sorobanContext: SorobanContextType,
  tokenAddress: string
) {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  const response = await contractInvoke({
    contractAddress: tokenAddress,
    method: "balance",
    args: [accountToScVal(address)],
    sorobanContext,
  });

  return scValToNumber(response);
}

export async function tokenDecimals(
  sorobanContext: SorobanContextType,
  tokenAddress: string
) {
  const response = await contractInvoke({
    contractAddress: tokenAddress,
    method: "decimals",
    sorobanContext,
  });

  return scValToNumber(response);
}

export const getAirdropStatus = async (
  sorobanContext: SorobanContextType,
  address: string,
  action: number
) => {
  const response = await contractInvoke({
    contractAddress: airdropContractId,
    method: "is_performed_action",
    args: [accountToScVal(address), xdr.ScVal.scvU32(action)],
    sorobanContext,
  });

  return scValToNative(response as any);
};

export const sendAsset = async (
  sorobanContext: SorobanContextType,
  asset: IAsset,
  recipient: string,
  memo: string,
  amount: number
) => {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  return contractInvoke({
    contractAddress: asset.contract,
    method: "transfer",
    args: [
      accountToScVal(address),
      accountToScVal(recipient),
      nativeToScVal(amount * Math.pow(10, asset.decimals), { type: "i128" }),
    ],
    memo,
    sorobanContext,
    signAndSend: true,
    reconnectAfterTx: false,
  });
};
