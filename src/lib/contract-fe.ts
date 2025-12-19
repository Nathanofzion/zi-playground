import { InvokeArgs, signAndSendTransaction } from "@soroban-react/contracts";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
import { LocalKeyStorage } from "./localKeyStorage";
import { account, server, initializeWallet } from "./passkey-kit";

const defaultAddress =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export async function contractInvoke({
  contractAddress,
  method,
  args = [],
  memo,
  signAndSend = false,
  fee = 100,
  skipAddingFootprint,
  secretKey,
  sorobanContext,
  reconnectAfterTx = true,
  timeoutSeconds = 20,
}: InvokeArgs & { memo?: string }) {
  const { server: sorobanServer, address, activeChain, activeConnector } = sorobanContext;
  
  // ⚠️ CRITICAL: Detect wallet type based on active connector, not localStorage
  // This ensures we use the correct signing method for the currently connected wallet
  const activeConnectorId = activeConnector?.id;
  const isPasskeyWallet = activeConnectorId === 'passkey';
  const isFreighterWallet = activeConnectorId === 'freighter';
  const isLobstrWallet = activeConnectorId === 'lobstr';
  
  console.log('🔍 Wallet detection:', {
    activeConnectorId,
    isPasskeyWallet,
    isFreighterWallet,
    isLobstrWallet,
    hasSecretKey: !!secretKey,
    address: address?.substring(0, 8) + '...',
    willUsePasskey: isPasskeyWallet,
    willUseTraditional: !isPasskeyWallet && (isFreighterWallet || isLobstrWallet || !!secretKey)
  });
  
  if (!activeChain) {
    throw new Error("No active Chain");
  }
  if (!sorobanServer) {
    throw new Error("No connected to a Server");
  }
  if (signAndSend && !secretKey && !activeConnector && !isPasskeyWallet) {
    throw new Error(
      "contractInvoke: You are trying to sign a txn without providing a source, secretKey or active connector"
    );
  }
  const networkPassphrase = activeChain.networkPassphrase!;
  let source = null;
  
  // ⚠️ CRITICAL: Handle source account differently for passkey (C-address) vs traditional (G-address)
  if (isPasskeyWallet) {
    // For passkey wallets, use contractId (C-address) as source
    const contractId = LocalKeyStorage.getPasskeyContractId();
    if (!contractId) {
      throw new Error("Passkey wallet not connected");
    }
    // C-addresses are contracts, not traditional accounts
    // Use default account for transaction building, contract will be the source
    try {
      // Try to get contract data to verify it exists
      await sorobanServer.getContractData(
        contractId,
        StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
      );
      // Contract exists, use default account for building (contract will sign)
      source = new StellarSdk.Account(defaultAddress, "0");
    } catch (error) {
      // Contract might not be initialized yet, still use default
      source = new StellarSdk.Account(defaultAddress, "0");
    }
  } else if (secretKey) {
    // Traditional G-address handling (Freighter/Lobstr)
    source = await sorobanServer.getAccount(
      StellarSdk.Keypair.fromSecret(secretKey).publicKey()
    );
  } else {
    try {
      if (!address) throw new Error("No address");
      source = await sorobanServer.getAccount(address);
    } catch (error) {
      source = new StellarSdk.Account(defaultAddress, "0");
    }
  }
  
  const contract = new StellarSdk.Contract(contractAddress);
  //Builds the transaction
  // NOTE: Soroban transactions (Protocol 23+) do NOT support memos
  // Adding a memo to a Soroban transaction will cause: "non-source auth Soroban tx uses memo or mixed source account"
  // ⚠️ CRITICAL: Use proper timeout (25 seconds) instead of TimeoutInfinite for LaunchTube compatibility
  // LaunchTube requires maxTime within 30 seconds, so use 25 for safety
  // Use the parameter value but cap at 25 for LaunchTube compatibility
  const txTimeout = Math.min(timeoutSeconds || 25, 25);
  let tx = new StellarSdk.TransactionBuilder(source, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(txTimeout);
  // Do NOT add memo to Soroban transactions - Protocol 23 prohibits it
  const txn = tx.build();

  const simulated = await sorobanServer.simulateTransaction(txn);
  if (Api.isSimulationError(simulated)) {
    console.error('❌ Simulation error:', simulated.error);
    throw new Error(simulated.error);
  } else if (!simulated.result) {
    console.error('❌ Simulation returned no result:', simulated);
    throw new Error(`invalid simulation: no result in ${simulated}`);
  }
  
  console.log('✅ Simulation successful:', {
    hasRetval: !!simulated.result?.retval,
    resultType: typeof simulated.result
  });
  
  if (!signAndSend && simulated) {
    return simulated.result?.retval;
  } else {
    // ⚠️ CRITICAL: Different signing path for passkey vs traditional wallets
    // ⚠️ PRIORITY: If Freighter/Lobstr is explicitly active, ALWAYS use traditional signing (never PasskeyID)
    if (isFreighterWallet || isLobstrWallet) {
      // Traditional wallet signing path (Freighter/Lobstr)
      const walletName = isFreighterWallet ? 'Freighter' : 'Lobstr';
      console.log(`📝 Signing and sending transaction with ${walletName} wallet...`);
      
      // ⚠️ CRITICAL: Ensure we're not using PasskeyID when Freighter/Lobstr is active
      if (isPasskeyWallet) {
        console.warn('⚠️ WARNING: isPasskeyWallet is true but Freighter/Lobstr is active. Using traditional signing.');
      }
      
      try {
        const res = await signAndSendTransaction({
          txn,
          skipAddingFootprint,
          secretKey,
          sorobanContext,
          timeoutSeconds,
        });

        console.log('✅ Transaction signed and sent:', {
          hasHash: !!(res && (('hash' in (res as any)) || ('txHash' in (res as any)))),
          hasResponse: !!res,
          responseType: typeof res
        });

        if (reconnectAfterTx) {
          sorobanContext.connect();
        }
        return res;
      } catch (error: any) {
        console.error('❌ Transaction signing/sending failed:', {
          message: error.message,
          stack: error.stack,
          error: error
        });
        throw error;
      }
    } else if (isPasskeyWallet) {
      // ⚠️ SAFETY CHECK: Verify activeConnector is actually PasskeyID
      if (activeConnectorId !== 'passkey') {
        throw new Error(
          `Wallet mismatch: activeConnector is "${activeConnectorId}" but isPasskeyWallet is true. ` +
          `This indicates a detection error. Please reconnect your wallet.`
        );
      }
      
      // Passkey signing path
      console.log('🔐 Signing with PasskeyID (C-address)...');
      const keyId = LocalKeyStorage.getPasskeyKeyId();
      if (!keyId) {
        throw new Error("Passkey keyId not found");
      }
      
      const contractId = LocalKeyStorage.getPasskeyContractId();
      if (!contractId) {
        throw new Error("Passkey contractId not found");
      }
      
      // ⚠️ CRITICAL: Initialize account.wallet before signing
      // This is required because account.wallet is only set during createWallet() or connectWallet()
      // When reconnecting, we need to manually initialize it
      initializeWallet(contractId);
      
      // Prepare transaction (adds contract footprint)
      const preparedTx = await sorobanServer.prepareTransaction(txn);
      
      // Sign with passkey (triggers WebAuthn authentication)
      // Note: passkey-kit's sign expects AssembledTransaction format
      // The preparedTx should be compatible, but we may need to cast
      console.log('🔑 Prompting for passkey authentication (biometric/PIN)...');
      const signedTx = await account.sign(preparedTx as any, { keyId });
      
      // Send via PasskeyServer (handles LaunchTube if configured)
      console.log('📤 Sending transaction via PasskeyServer...');
      try {
        const result = await server.send(signedTx);
        
        if (reconnectAfterTx) {
          sorobanContext.connect();
        }
        
        console.log('✅ Passkey transaction signed and sent successfully');
        return result;
      } catch (launchtubeError: any) {
        // Handle LaunchTube errors with better error messages
        const errorMsg = launchtubeError?.error || launchtubeError?.message || JSON.stringify(launchtubeError);
        const isTimeBoundsError = errorMsg.includes('timeBounds') || 
                                  errorMsg.includes('maxTime') || 
                                  errorMsg.includes('too far') ||
                                  errorMsg.includes('timeout');
        
        console.error('❌ LaunchTube submission failed:', {
          error: errorMsg,
          isTimeBoundsError,
          fullError: launchtubeError
        });
        
        if (isTimeBoundsError) {
          throw new Error(
            'Transaction timebounds are invalid. LaunchTube requires maxTime within 30 seconds. ' +
            'This transaction was built with a 25-second timeout. If this error persists, ' +
            'the transaction may need to be rebuilt with fresh timebounds.'
          );
        }
        
        // Check for trustline/authorization errors
        const isTrustlineError = errorMsg.includes('trustline') || 
                                 errorMsg.includes('authorization') ||
                                 errorMsg.includes('MissingValue') ||
                                 errorMsg.includes('not authorized');
        
        if (isTrustlineError) {
          throw new Error(
            'Recipient may not have authorized receiving this token. ' +
            'For C-address (smart contract) wallets, the recipient needs to initialize their balance storage for this token first. ' +
            'Please ensure the recipient has interacted with this token contract before sending.'
          );
        }
        
        // Generic error
        throw new Error(`Transaction submission failed: ${errorMsg}`);
      }
    } else {
      // Fallback: Traditional wallet signing path for other wallets or when no specific wallet is detected
      const walletName = secretKey ? 'SecretKey' : activeConnectorId || 'Unknown';
      console.log(`📝 Signing and sending transaction with ${walletName} wallet (fallback path)...`);
      
      try {
        const res = await signAndSendTransaction({
          txn,
          skipAddingFootprint,
          secretKey,
          sorobanContext,
          timeoutSeconds,
        });

        console.log('✅ Transaction signed and sent:', {
          hasHash: !!(res && (('hash' in (res as any)) || ('txHash' in (res as any)))),
          hasResponse: !!res,
          responseType: typeof res
        });

        if (reconnectAfterTx) {
          sorobanContext.connect();
        }
        return res;
      } catch (error: any) {
        console.error('❌ Transaction signing/sending failed:', {
          message: error.message,
          stack: error.stack,
          error: error
        });
        throw error;
      }
    }
  }
}
