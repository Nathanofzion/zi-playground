import { SorobanContextType } from "@soroban-react/core";
// ❌ REMOVED: import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

import { IAsset } from "@/interfaces";
import { contractInvoke } from "@/lib/contract-fe";
import { accountToScVal, scValToNumber } from "@/utils";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

// ✅ API-based conversion functions
async function nativeToScVal(value: any, options?: { type?: string }) {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'nativeToScVal', 
        value,
        options 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Native to ScVal conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('nativeToScVal error:', error);
    throw error;
  }
}

async function scValToNative(scVal: any) {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'scValToNative', 
        scVal 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ScVal to native conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('scValToNative error:', error);
    throw error;
  }
}

async function createScValU32(value: number) {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'nativeToScVal', 
        value,
        options: { type: 'u32' }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'U32 ScVal creation failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('createScValU32 error:', error);
    throw error;
  }
}

export async function tokenBalance(
  sorobanContext: SorobanContextType,
  tokenAddress: string
) {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  try {
    const accountScVal = await accountToScVal(address);

    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: "balance",
      args: [accountScVal],
      sorobanContext,
    });

    return scValToNumber(response);
  } catch (error) {
    console.error('Token balance error:', error);
    throw error;
  }
}

export async function tokenDecimals(
  sorobanContext: SorobanContextType,
  tokenAddress: string
) {
  try {
    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: "decimals",
      sorobanContext,
    });

    return scValToNumber(response);
  } catch (error) {
    console.error('Token decimals error:', error);
    throw error;
  }
}

export const getAirdropStatus = async (
  sorobanContext: SorobanContextType,
  address: string,
  action: number
) => {
  try {
    const accountScVal = await accountToScVal(address);
    const actionScVal = await createScValU32(action);

    const response = await contractInvoke({
      contractAddress: airdropContractId,
      method: "is_performed_action",
      args: [accountScVal, actionScVal],
      sorobanContext,
    });

    return await scValToNative(response as any);
  } catch (error) {
    console.error('Airdrop status error:', error);
    throw error;
  }
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

  try {
    const senderScVal = await accountToScVal(address);
    const recipientScVal = await accountToScVal(recipient);
    const amountScVal = await nativeToScVal(
      amount * Math.pow(10, asset.decimals), 
      { type: "i128" }
    );

    return await contractInvoke({
      contractAddress: asset.contract,
      method: "transfer",
      args: [
        senderScVal,
        recipientScVal,
        amountScVal,
      ],
      memo,
      sorobanContext,
      signAndSend: true,
      reconnectAfterTx: false,
    });
  } catch (error) {
    console.error('Send asset error:', error);
    throw error;
  }
};

// ✅ Additional utility functions for contract interactions
export const getTokenName = async (
  sorobanContext: SorobanContextType,
  tokenAddress: string
) => {
  try {
    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: "name",
      sorobanContext,
    });

    return await scValToNative(response);
  } catch (error) {
    console.error('Token name error:', error);
    throw error;
  }
};

export const getTokenSymbol = async (
  sorobanContext: SorobanContextType,
  tokenAddress: string
) => {
  try {
    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: "symbol",
      sorobanContext,
    });

    return await scValToNative(response);
  } catch (error) {
    console.error('Token symbol error:', error);
    throw error;
  }
};

export const approveToken = async (
  sorobanContext: SorobanContextType,
  tokenAddress: string,
  spender: string,
  amount: number,
  decimals: number
) => {
  const { address } = sorobanContext;

  if (!address) {
    throw new Error("Wallet is not connected yet.");
  }

  try {
    const ownerScVal = await accountToScVal(address);
    const spenderScVal = await accountToScVal(spender);
    const amountScVal = await nativeToScVal(
      amount * Math.pow(10, decimals),
      { type: "i128" }
    );

    return await contractInvoke({
      contractAddress: tokenAddress,
      method: "approve",
      args: [ownerScVal, spenderScVal, amountScVal],
      sorobanContext,
      signAndSend: true,
      reconnectAfterTx: false,
    });
  } catch (error) {
    console.error('Token approval error:', error);
    throw error;
  }
};

export const getAllowance = async (
  sorobanContext: SorobanContextType,
  tokenAddress: string,
  owner: string,
  spender: string
) => {
  try {
    const ownerScVal = await accountToScVal(owner);
    const spenderScVal = await accountToScVal(spender);

    const response = await contractInvoke({
      contractAddress: tokenAddress,
      method: "allowance",
      args: [ownerScVal, spenderScVal],
      sorobanContext,
    });

    return scValToNumber(response);
  } catch (error) {
    console.error('Token allowance error:', error);
    throw error;
  }
};