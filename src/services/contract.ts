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
  const isZionToken = tokenAddress === zionToken.contract;

  try {
    // Convert the user's address to proper ScVal format
    const accountScVal = new StellarSdk.Address(address).toScVal();

    // First, try to get balance directly
    try {
      const response = await contractInvoke({
        contractAddress: tokenAddress,
        method: "balance",
        args: [accountScVal],
        sorobanContext,
      });

      console.log("Response From Get Balance : ",response);
      return scValToNumber(response);
    } catch (balanceError: any) {
      // If balance call fails with trustline error and it's ZITOKEN, create trustline
      const isTrustlineError = balanceError?.message?.includes("trustline") || 
                                balanceError?.message?.includes("Contract, #13") ||
                                balanceError?.message?.includes("trustline entry is missing");
      
      if (isTrustlineError && isZionToken) {
        console.log('⚠️ Trustline missing for ZITOKEN, creating trustline...');
        
        const server = new StellarSdk.Horizon.Server(CONFIG.HORIZON_URL);
        const account = await server.loadAccount(address);
        
        // Check if trustline already exists in Horizon (might be a contract trustline issue)
        const trustline = account.balances.find(balance =>
          balance.asset_type !== 'native' &&
          'asset_code' in balance &&
          balance.asset_code === CONFIG.TOKEN_CODE &&
          balance.asset_issuer === zionToken.issuer
        );

        if (!trustline) {
          // Create Horizon trustline for ZITOKEN
          const asset = new StellarSdk.Asset(CONFIG.TOKEN_CODE, zionToken.issuer);

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

          // Check for Passkey wallet first (by ID or name)
          const isPasskey = activeConnector?.id === 'passkey' || 
                            walletName.includes('passkey') || 
                            walletName.includes('passkeyid');

          console.log("Active Connector At Trustline : ",activeConnector);
          
          
          if (isPasskey) {
            // Support Passkey wallet for trustline creation
            console.log('🔐 Signing trustline transaction with Passkey...');
            
            if (!activeConnector?.signTransaction) {
              throw new Error("Passkey connector does not support transaction signing. Please reconnect your wallet.");
            }

            try {
              const signedResult = await activeConnector.signTransaction(tx.toXDR(), {
                networkPassphrase: networkPassphrase,
                accountToSign: address
              });

              // Handle different return formats from Passkey
              let signedXdrString: string;
              
              if (typeof signedResult === 'string') {
                signedXdrString = signedResult;
              } else if (signedResult && typeof signedResult === 'object') {
                // Check for common property names
                if ('signedTxXdr' in signedResult) {
                  signedXdrString = (signedResult as any).signedTxXdr;
                } else if ('xdr' in signedResult) {
                  signedXdrString = (signedResult as any).xdr;
                } else if ('signedXdr' in signedResult) {
                  signedXdrString = (signedResult as any).signedXdr;
                } else {
                  throw new Error(`Passkey signTransaction returned unexpected object format: ${JSON.stringify(Object.keys(signedResult))}`);
                }
              } else {
                throw new Error(`Passkey signTransaction returned invalid format: ${typeof signedResult}`);
              }

              // Parse the signed XDR
              try {
                signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
                  signedXdrString,
                  networkPassphrase
                ) as StellarSdk.Transaction;
                console.log('✅ Trustline transaction signed with Passkey');
              } catch (xdrError: any) {
                console.error('❌ XDR parsing error:', xdrError);
                console.error('XDR string length:', signedXdrString.length);
                console.error('XDR preview:', signedXdrString.substring(0, 100));
                throw new Error(`Failed to parse signed XDR from Passkey: ${xdrError.message || xdrError}. This might indicate the transaction was not signed correctly.`);
              }
            } catch (error: any) {
              console.error('❌ Passkey trustline signing failed:', error);
              throw new Error(`Failed to sign trustline transaction with Passkey: ${error.message || error}`);
            }
          } else if (walletName.includes('freighter')) {
            // Freighter wallet support
            const signedResponse = await signTransaction(tx.toXDR(), {
              networkPassphrase: networkPassphrase,
              address: address
            });

            signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
              signedResponse.signedTxXdr,
              networkPassphrase
            ) as StellarSdk.Transaction;
            console.log('✅ Trustline transaction signed with Freighter');
          } else if(walletName.includes('lobstr')){
            // Support Lobstr wallet for trustline creation
            console.log('🔐 Signing trustline transaction with Lobstr...');
            
            if (!activeConnector?.signTransaction) {
              throw new Error("Lobstr connector does not support transaction signing. Please reconnect your wallet.");
            }

            try {
              const signedResult = await activeConnector.signTransaction(tx.toXDR(), {
                networkPassphrase: networkPassphrase,
                accountToSign: address
              });

              // Handle different return formats from Lobstr
              let signedXdrString: string;
              
              if (typeof signedResult === 'string') {
                signedXdrString = signedResult;
              } else if (signedResult && typeof signedResult === 'object') {
                // Check for common property names
                if ('signedTxXdr' in signedResult) {
                  signedXdrString = (signedResult as any).signedTxXdr;
                } else if ('xdr' in signedResult) {
                  signedXdrString = (signedResult as any).xdr;
                } else if ('signedXdr' in signedResult) {
                  signedXdrString = (signedResult as any).signedXdr;
                } else {
                  throw new Error(`Lobstr signTransaction returned unexpected object format: ${JSON.stringify(Object.keys(signedResult))}`);
                }
              } else {
                throw new Error(`Lobstr signTransaction returned invalid format: ${typeof signedResult}`);
              }

              // Parse the signed XDR
              try {
                signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
                  signedXdrString,
                  networkPassphrase
                ) as StellarSdk.Transaction;
                console.log('✅ Trustline transaction signed with Lobstr');
              } catch (xdrError: any) {
                console.error('❌ XDR parsing error:', xdrError);
                console.error('XDR string length:', signedXdrString.length);
                console.error('XDR preview:', signedXdrString.substring(0, 100));
                throw new Error(`Failed to parse signed XDR from Lobstr: ${xdrError.message || xdrError}. This might indicate the transaction was not signed correctly.`);
              }
            } catch (error: any) {
              console.error('❌ Lobstr trustline signing failed:', error);
              throw new Error(`Failed to sign trustline transaction with Lobstr: ${error.message || error}`);
            }
          }
          else{
            throw new Error(`Unsupported wallet connector: ${walletName || activeConnector?.id || 'unknown'}. Only Freighter and Passkey are currently supported for trustline creation.`);
          }

          console.log('Submitting trustline transaction to network...');
          const result = await server.submitTransaction(signedTransaction);

          console.log('✅ Trustline created successfully!');
          console.log('Transaction hash:', result.hash);

          // Wait a moment for trustline to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Retry balance call
          const response = await contractInvoke({
            contractAddress: tokenAddress,
            method: "balance",
            args: [accountScVal],
            sorobanContext,
          });

          console.log("Response From Get Balance After Trustline : ",response);
          return scValToNumber(response);
        } else {
          // Trustline exists in Horizon but contract says it doesn't - might be contract trustline issue
          console.warn('⚠️ Horizon trustline exists but contract reports missing trustline. This might be a contract-level trustline issue.');
          throw balanceError; // Re-throw the original error
        }
      } else {
        // Not a trustline error or not ZITOKEN - re-throw the error
        throw balanceError;
      }
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

    // Check if recipient is a C-address (smart contract wallet)
    const isRecipientCAddress = recipient.startsWith('C');
    const walletType = sorobanContext.activeConnector?.id || '';
    const isSenderPasskey = walletType === 'passkey';
    
    console.log('📤 Sending transfer transaction:', {
      contract: asset.contract,
      sender: address.substring(0, 8) + '...',
      recipient: recipient.substring(0, 8) + '...',
      amount: amount,
      amountInSmallestUnit: amountString,
      decimals: asset.decimals,
      isRecipientCAddress,
      isSenderPasskey
    });

    // ⚠️ IMPORTANT: For C-address recipients, they need to have initialized their balance storage
    // This is typically done automatically on first receive, but we should handle errors gracefully
    if (isRecipientCAddress && !isSenderPasskey) {
      console.log('ℹ️ Sending to C-address (smart contract wallet). Recipient will automatically initialize balance storage on first receive.');
    }

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
      hash: (result && 'hash' in result) ? result.hash : ((result && 'transactionHash' in result) ? (result as any).transactionHash : 'no hash found')
    });

    return result;
  } catch (error: any) {
    console.error('❌ Send asset error:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
    
    // Provide more helpful error messages for common issues
    const errorMsg = error?.message || error?.error || JSON.stringify(error);
    
    // Check for trustline/authorization errors for C-address recipients
    if (recipient.startsWith('C') && (
      errorMsg.includes('trustline') || 
      errorMsg.includes('authorization') ||
      errorMsg.includes('MissingValue') ||
      errorMsg.includes('not authorized') ||
      errorMsg.includes('Storage, MissingValue')
    )) {
      throw new Error(
        `Failed to send token to C-address recipient. The recipient may need to initialize their balance storage for this token first. ` +
        `This typically happens automatically, but if this error persists, the recipient should interact with the token contract first. ` +
        `Original error: ${errorMsg}`
      );
    }
    
    // Check for timebounds errors
    if (errorMsg.includes('timeBounds') || errorMsg.includes('maxTime') || errorMsg.includes('too far')) {
      throw new Error(
        `Transaction timebounds error. This may be a temporary issue. Please try again. ` +
        `Original error: ${errorMsg}`
      );
    }
    
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