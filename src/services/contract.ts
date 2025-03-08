import { contractInvoke } from "@soroban-react/contracts";
import { SorobanContextType } from "@soroban-react/core";
import { Asset } from "@stellar-asset-lists/sdk";
import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

import { accountToScVal, scValToNumber } from "@/utils";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

const processTx = async (tx: Promise<any>) => {
  try {
    return await tx;
  } catch (err: any) {
    const response = JSON.parse(err.message);
    if (response.status == "SUCCESS") {
      return response;
    }
    throw new Error(err.message);
  }
};

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
  asset: Asset,
  recipient: string,
  amount: number
) => {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  return await processTx(
    contractInvoke({
      contractAddress: asset.contract,
      method: "transfer",
      args: [
        accountToScVal(address),
        accountToScVal(recipient),
        nativeToScVal(amount * Math.pow(10, asset.decimals), { type: "i128" }),
      ],
      sorobanContext,
      signAndSend: true,
      reconnectAfterTx: false,
    })
  );
};
