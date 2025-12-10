import { SorobanContextType } from "@soroban-react/core";
// ❌ REMOVED: import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

import { IAsset } from "@/interfaces";
import { contractInvoke } from "@/lib/contract-fe";
import { accountToScVal, scValToNumber } from "@/utils";
import * as StellarSdk from "@stellar/stellar-sdk";
import zionToken from "@/constants/zionToken";
import { signTransaction } from '@stellar/freighter-api';

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

const CONFIG = {
    NETWORK: 'testnet',
    HORIZON_URL: 'https://horizon-testnet.stellar.org',
    NETWORK_PASSPHRASE: StellarSdk.Networks.TESTNET,
    TOKEN_CODE: 'ZITOKEN',
};

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
  const { address , activeChain , activeConnector } = sorobanContext;

  if (!address || !activeChain) {
    throw new Error("Wallet is not connected yet.");
  }

  const walletName = activeConnector?.name?.toLowerCase() || '';

  const networkPassphrase = activeChain.networkPassphrase!;

  try {
    
    // Convert the user's address to proper ScVal format
    const accountScVal = new StellarSdk.Address(address).toScVal();

    const server = new StellarSdk.Horizon.Server(CONFIG.HORIZON_URL);
    const account = await server.loadAccount(address)
    // Check if the account has a trustline for ZITOKEN
    const trustline = account.balances.find(balance =>
        balance.asset_type !== 'native' &&
        'asset_code' in balance &&
        balance.asset_code === CONFIG.TOKEN_CODE &&
        balance.asset_issuer === zionToken.issuer
    )
    if (trustline) {
        console.log('✅ Trustline exists!');

        const response = await contractInvoke({
          contractAddress: tokenAddress,
          method: "balance",
          args: [accountScVal],
          sorobanContext,
        });

        console.log("Response From Get Balance : ",response);

        return scValToNumber(response);
    } else {

      const asset = new StellarSdk.Asset(CONFIG.TOKEN_CODE,zionToken.issuer);

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: networkPassphrase
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: "1000000000" 
          })
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();

      let signedTransaction: StellarSdk.Transaction;

      if(walletName.includes('freighter')){
        const signedResponse = await signTransaction(tx.toXDR(), {
          networkPassphrase: networkPassphrase,
          address: address
        });

        signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
          signedResponse.signedTxXdr,
          networkPassphrase
        ) as StellarSdk.Transaction;
      } else {
        throw new Error("Unsupported wallet connector. Only Freighter is currently supported.");
      }

      console.log('Submitting transaction to network...');
      const result = await server.submitTransaction(signedTransaction);

      console.log('✅ Trustline created successfully!');
      console.log('Transaction hash:', result.hash);

      const response = await contractInvoke({
          contractAddress: tokenAddress,
          method: "balance",
          args: [accountScVal],
          sorobanContext,
        });

        console.log("Response From Get Balance : ",response);

        return scValToNumber(response);
    }
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
    // accountToScVal returns base64 XDR string, need to parse to ScVal object for contractInvoke
    const accountScValBase64 = await accountToScVal(address);
    const accountScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(accountScValBase64, 'base64')
    );
    
    // createScValU32 returns base64 XDR string; convert to ScVal for contractInvoke
    const actionScValBase64 = await createScValU32(action);
    const actionScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(actionScValBase64, 'base64')
    );

    const response = await contractInvoke({
      contractAddress: airdropContractId,
      method: "is_performed_action",
      args: [accountScVal, actionScVal],
      sorobanContext,
    });

    return await scValToNative(response as any);
  } catch (error: any) {
    // Handle MissingValue error gracefully - means action hasn't been performed yet
    if (error?.message?.includes("Storage, MissingValue") || 
        error?.message?.includes("MissingValue") ||
        error?.message?.includes("trying to get non-existing value")) {
      // Return false instead of throwing - this is expected for new users/actions
      return false;
    }
    
    // Log other errors but don't crash the app
    console.warn('Airdrop status check failed:', error?.message || error);
    // Return false for any other errors too - better UX than crashing
    return false;
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
    // accountToScVal returns base64 XDR strings, need to parse to ScVal objects for contractInvoke
    const senderScValBase64 = await accountToScVal(address);
    const recipientScValBase64 = await accountToScVal(recipient);
    const senderScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(senderScValBase64, 'base64')
    );
    const recipientScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(recipientScValBase64, 'base64')
    );
    
    // Validate ScVal objects have proper switch method
    if (typeof senderScVal.switch !== 'function' || typeof recipientScVal.switch !== 'function') {
      throw new Error('Invalid ScVal: sender or recipient ScVal is not properly constructed');
    }
    
    // Convert amount to proper i128 format (handle large numbers as string)
    const amountInSmallestUnit = amount * Math.pow(10, asset.decimals);
    // Convert to string to preserve precision for large numbers
    const amountString = amountInSmallestUnit.toString();
    
    // nativeToScVal returns base64 XDR string, need to parse to ScVal object for contractInvoke
    const amountScValBase64 = await nativeToScVal(
      amountString, 
      { type: "i128" }
    );
    const amountScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(amountScValBase64, 'base64')
    );
    
    // Validate amount ScVal
    if (typeof amountScVal.switch !== 'function') {
      throw new Error('Invalid ScVal: amount ScVal is not properly constructed');
    }

    console.log('📤 Sending transfer transaction:', {
      contract: asset.contract,
      sender: address.substring(0, 8) + '...',
      recipient: recipient.substring(0, 8) + '...',
      amount: amount,
      amountInSmallestUnit: amountString,
      decimals: asset.decimals
    });

    const result = await contractInvoke({
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

    console.log('✅ Transfer transaction result:', {
      hasResult: !!result,
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : [],
      hash: result?.hash || result?.transactionHash || 'no hash found'
    });

    return result;
  } catch (error: any) {
    console.error('❌ Send asset error:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
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
    // accountToScVal returns base64 XDR strings, need to parse to ScVal objects for contractInvoke
    const ownerScValBase64 = await accountToScVal(address);
    const spenderScValBase64 = await accountToScVal(spender);
    const ownerScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(ownerScValBase64, 'base64')
    );
    const spenderScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(spenderScValBase64, 'base64')
    );
    
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
    // accountToScVal returns base64 XDR strings, need to parse to ScVal objects for contractInvoke
    const ownerScValBase64 = await accountToScVal(owner);
    const spenderScValBase64 = await accountToScVal(spender);
    const ownerScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(ownerScValBase64, 'base64')
    );
    const spenderScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(spenderScValBase64, 'base64')
    );

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