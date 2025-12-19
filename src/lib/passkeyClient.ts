import { activeChain } from "./chain";
import { account, server, initializeWallet } from "./passkey-kit";
import { LocalKeyStorage } from "./localKeyStorage";
import * as StellarSdk from "@stellar/stellar-sdk";
import zionToken from "@/constants/zionToken";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { accountToScVal, nativeToScVal } from "@/utils";

/**
 * Alternative server send that bypasses LaunchTube's strict timebounds
 */
const sendToRpcDirectly = async (signedTx: any, rpcUrl: string) => {
  // Get XDR from AssembledTransaction or Transaction
  let xdr: string;
  if (signedTx && typeof signedTx === 'object' && 'built' in signedTx) {
    // It's an AssembledTransaction - get XDR from built transaction
    xdr = (signedTx as any).built?.toXDR() || (signedTx as any).toXDR?.() || '';
  } else if (typeof signedTx === 'string') {
    xdr = signedTx;
  } else {
    xdr = (signedTx as any).toXDR?.() || '';
  }
  
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: {
        transaction: xdr,
      },
    }),
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message || 'Transaction submission failed');
  }
  
  return result.result;
};

/**
 * Initialize ZION token trustline/balance for a passkey wallet
 * For Soroban tokens, this initializes the balance storage by calling the balance method
 * which automatically creates the storage entry if it doesn't exist
 */
async function initializeZionTokenTrustline(contractId: string, keyId: string) {
  try {
    // Wait a moment for the wallet to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const rpc = new StellarSdk.SorobanRpc.Server(
      process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
      { allowHttp: true }
    );
    
    // Initialize the wallet in PasskeyKit
    initializeWallet(contractId);
    
    // For Soroban tokens, we initialize the balance storage by calling balance
    // This automatically creates the storage entry if it doesn't exist
    const zionContractAddress = zionToken.contract;
    
    // Convert contractId to ScVal for balance method
    const contractIdScValBase64 = await accountToScVal(contractId);
    const contractIdScVal = StellarSdk.xdr.ScVal.fromXDR(
      Buffer.from(contractIdScValBase64, 'base64')
    );
    
    // Build balance query transaction (read-only, doesn't need signing)
    const defaultAddress = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const source = new StellarSdk.Account(defaultAddress, "0");
    
    const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
    const contract = new StellarSdk.Contract(zionContractAddress);
    
    const tx = new StellarSdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(contract.call("balance", contractIdScVal))
      .setTimeout(30)
      .build();
    
    // Simulate the transaction to initialize the storage (read-only operation)
    try {
      const simulated = await rpc.simulateTransaction(tx);
      console.log('✅ ZION token balance storage initialized (simulated)');
    } catch (simError: any) {
      // If simulation fails, try to actually call balance with signing
      // This will create the storage entry
      console.log('⚠️ Balance simulation failed, attempting to initialize with signed transaction...');
      
      // Prepare transaction
      const preparedTx = await rpc.prepareTransaction(tx);
      
      // Sign with passkey
      const signedTx = await account.sign(preparedTx as any, { keyId });
      
      // Send via PasskeyServer (LaunchTube)
      try {
        await server.send(signedTx);
        console.log('✅ ZION token balance initialization transaction submitted successfully');
      } catch (sendError: any) {
        // If LaunchTube fails, try direct RPC
        console.warn('⚠️ LaunchTube submission failed, trying direct RPC...');
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
        await sendToRpcDirectly(signedTx, rpcUrl);
        console.log('✅ ZION token balance initialization submitted via direct RPC');
      }
    }
    
    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error: any) {
    console.error('❌ Failed to initialize ZION token trustline:', error);
    throw error;
  }
}

/**
 * PasskeyID Wallet Connector for SorobanReact
 * Implements smart contract wallet (C-address) using passkey-kit
 */
const passkey = () => {
  // Helper function to generate challenge
  const generateChallenge = (): string => {
    const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...challengeBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  // Helper function to generate user ID
  const generateUserId = (): string => {
    const userIdBytes = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...userIdBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  return {
    id: "passkey",
    name: "PasskeyID",
    shortName: "Passkey",
    iconUrl: "/images/passkey.png",
    iconBackground: "#4f46e5",
    installed: true,
    downloadUrls: {},

    isConnected: async () => {
      const keyId = LocalKeyStorage.getPasskeyKeyId();
      const contractId = LocalKeyStorage.getPasskeyContractId();
      const wallet = LocalKeyStorage.getWallet();
      return !!(keyId && contractId && wallet?.walletType === 'passkey');
    },

    getNetworkDetails: async () => activeChain,

    getPublicKey: async () => {
      console.log('🔐 Getting PasskeyID public key (C-address)...');
      
      // 🔍 DEBUG: Verify timeoutInSeconds is set correctly
      const timeoutValue = (account as any).timeoutInSeconds;
      console.log('🔍 PasskeyKit timeoutInSeconds:', timeoutValue);
      if (!timeoutValue || timeoutValue !== 25) {
        console.warn('⚠️ timeoutInSeconds not set correctly, setting to 25...');
        (account as any).timeoutInSeconds = 25;
      }
      
      try {
        const storedKeyId = LocalKeyStorage.getPasskeyKeyId();
        const storedContractId = LocalKeyStorage.getPasskeyContractId();
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // RECONNECTION FLOW: Require WebAuthn Authentication
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (storedKeyId && storedContractId) {
          console.log('📱 Found stored passkey, requiring WebAuthn authentication...');
          
          try {
            // Verify contract exists on-chain
            const rpc = new StellarSdk.SorobanRpc.Server(
              process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
              { allowHttp: true }
            );
            
            await rpc.getContractData(
              storedContractId,
              StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
            );
            
            // Contract exists - now require WebAuthn authentication
            console.log('✅ Contract verified, requiring PIN/biometric verification...');
            
            const challenge = generateChallenge();
            
            // Convert base64 keyId to base64url for WebAuthn
            const credentialId = storedKeyId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            
            const authOptions = {
              challenge,
              timeout: 60000,
              rpId: window.location.hostname,
              // PIN/Biometric required
              userVerification: "required" as const,
              allowCredentials: [{
                id: credentialId,
                type: "public-key" as const,
                transports: ["internal", "hybrid"] as ("internal" | "hybrid")[]
              }]
            };
            
            console.log('🔐 Starting WebAuthn authentication (PIN/biometric required)...');
            const authResponse = await startAuthentication({ optionsJSON: authOptions });
            
            if (!authResponse) {
              throw new Error('Authentication was cancelled or failed');
            }
            
            console.log('✅ WebAuthn authentication completed successfully');
            
            // Authentication successful - proceed with reconnection
            console.log('✅ Reconnected to existing passkey wallet');
            
            initializeWallet(storedContractId);
            
            LocalKeyStorage.storeWallet({
              publicKey: storedContractId,
              walletType: 'passkey',
              timestamp: Date.now(),
            });
            
            const token = `passkey_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            LocalKeyStorage.storeToken(token);
            
            return storedContractId;
            
          } catch (contractError) {
            console.log('⚠️ Stored contract not found on-chain, creating new wallet...');
            LocalKeyStorage.clearAll();
            // Fall through to create new wallet
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // FIRST-TIME CONNECTION: WebAuthn Registration → Create Wallet
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('🆕 Creating new passkey wallet...');
        console.log('🔑 Step 1: WebAuthn registration (PIN/biometric required)...');
        
        // Step 1: Explicit WebAuthn Registration with PIN/Biometric
        const challenge = generateChallenge();
        const userId = generateUserId();
        
        const registrationOptions = {
          challenge,
          rp: {
            name: "ZI Playground",
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: "user@zi-playground.com",
            displayName: "ZI Playground User"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" as const },   // ES256
            { alg: -257, type: "public-key" as const }  // RS256
          ],
          timeout: 60000,
          attestation: "none" as const,
          authenticatorSelection: {
            authenticatorAttachment: "platform" as const,
            userVerification: "required" as const,  // ✅ PIN/Biometric REQUIRED
            requireResidentKey: false
          }
        };
        
        const regResponse = await startRegistration({ optionsJSON: registrationOptions });
        
        if (!regResponse) {
          throw new Error('WebAuthn registration was cancelled or failed');
        }
        
        console.log('✅ WebAuthn registration completed with PIN/biometric verification');
        console.log('🔑 Step 2: Creating wallet with registered credential...');
        
        // Step 2: Create wallet using passkey-kit
        // Note: passkey-kit may use the credential we just registered
        const {
          keyIdBase64,
          contractId,
          signedTx,
        } = await account.createWallet(
          "ZI Playground",
          "User Wallet"
        );

        console.log('✅ Wallet created:', {
          keyId: keyIdBase64.substring(0, 16) + '...',
          contractId: contractId.substring(0, 8) + '...' + contractId.substring(contractId.length - 8),
        });

        // Submit wallet creation transaction
        console.log('📤 Submitting wallet creation transaction...');
        
        try {
          // Try LaunchTube first
          console.log('📡 Attempting submission via LaunchTube...');
          await server.send(signedTx);
          console.log('✅ Wallet creation transaction submitted via LaunchTube');
        } catch (launchtubeError: any) {
          const errorMsg = launchtubeError?.error || launchtubeError?.message || '';
          const isTimeBoundsError = errorMsg.includes('timeBounds') || 
                                    errorMsg.includes('maxTime') || 
                                    errorMsg.includes('too far');
          
          console.warn('⚠️ LaunchTube submission failed:', errorMsg);
          
          if (isTimeBoundsError) {
            console.log('⚠️ Timebounds error detected. This indicates timeoutInSeconds may not be working correctly.');
            console.log('💡 The transaction was built with incorrect timebounds. This is a known issue.');
          }
          
          // Fallback to direct RPC submission
          console.log('🔄 Falling back to direct RPC submission...');
          try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
            const result = await sendToRpcDirectly(signedTx, rpcUrl);
            console.log('✅ Wallet creation transaction submitted via direct RPC:', result);
          } catch (rpcError: any) {
            console.error('❌ Direct RPC submission also failed:', rpcError);
            
            // Check if contract might already be deployed despite errors
            const rpc = new StellarSdk.SorobanRpc.Server(
              process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
              { allowHttp: true }
            );
            
            try {
              console.log('🔍 Checking if contract was deployed anyway...');
              await rpc.getContractData(
                contractId,
                StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
              );
              console.log('✅ Contract exists on-chain despite submission error!');
            } catch (checkError) {
              console.error('❌ Contract not found on-chain');
              throw new Error(
                'Failed to deploy wallet contract. This is likely due to transaction timebounds being too far in the future. ' +
                'LaunchTube requires maxTime within 30 seconds. ' +
                'Please ensure passkey-kit is configured with timeoutInSeconds: 25'
              );
            }
          }
        }

        // Store credentials locally
        LocalKeyStorage.storePasskeyKeyId(keyIdBase64);
        LocalKeyStorage.storePasskeyContractId(contractId);
        
        // ⚠️ CRITICAL: Initialize account.wallet for signing
        // Note: account.wallet is already set by createWallet(), but we ensure it's initialized
        initializeWallet(contractId);
        
        // Generate token for session
        const token = `passkey_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        LocalKeyStorage.storeToken(token);
        
        // Store wallet data
        LocalKeyStorage.storeWallet({
          publicKey: contractId, // C-address, not G-address
          walletType: 'passkey',
          timestamp: Date.now(),
          token
        });

        // Store user data
        LocalKeyStorage.storeUser({
          id: contractId,
          name: 'PasskeyID User',
          timestamp: Date.now(),
          walletConnected: true,
          token
        });

        console.log('🎉 PasskeyID wallet created and connected successfully:', {
          contractId: contractId.substring(0, 8) + '...' + contractId.substring(contractId.length - 8),
          isCAddress: contractId.startsWith('C'),
        });

        // Fund wallet with XLM from friendbot (testnet only)
        const isTestnet = (process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "").includes("Test");
        if (isTestnet) {
          console.log('💰 Funding passkey wallet with XLM from friendbot...');
          try {
            // Wait a moment for the contract to be fully deployed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Call friendbot API to fund the wallet
            const friendbotUrl = `https://friendbot.stellar.org/?addr=${contractId}`;
            const friendbotResponse = await fetch(friendbotUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            });

            if (friendbotResponse.ok) {
              const friendbotResult = await friendbotResponse.json().catch(() => ({}));
              console.log('✅ Wallet funded successfully via friendbot:', {
                contractId: contractId.substring(0, 8) + '...',
                transactionHash: friendbotResult.hash || 'N/A',
              });
            } else {
              // Friendbot might return an error if account already exists or rate limited
              const errorText = await friendbotResponse.text().catch(() => 'Unknown error');
              console.warn('⚠️ Friendbot funding response:', {
                status: friendbotResponse.status,
                statusText: friendbotResponse.statusText,
                error: errorText.substring(0, 100),
              });
              // Don't throw - wallet creation was successful, funding is optional
            }
          } catch (fundingError: any) {
            // Don't fail wallet creation if funding fails
            console.warn('⚠️ Friendbot funding failed (non-critical):', fundingError.message);
            console.log('💡 Wallet was created successfully. You can fund it manually if needed.');
          }
        } else {
          console.log('ℹ️ Skipping friendbot funding (not on testnet)');
        }

        // Initialize ZION token trustline/balance for the new passkey wallet
        try {
          console.log('🔗 Initializing ZION token trustline/balance for passkey wallet...');
          await initializeZionTokenTrustline(contractId, keyIdBase64);
          console.log('✅ ZION token trustline/balance initialized successfully');
        } catch (trustlineError: any) {
          // Don't fail wallet creation if trustline initialization fails
          console.warn('⚠️ ZION token trustline initialization failed (non-critical):', trustlineError.message);
          console.log('💡 Wallet was created successfully. You can initialize the trustline manually if needed.');
        }

        return contractId;

      } catch (error: any) {
        // Handle authentication cancellation specifically
        if (error.message?.includes('cancelled') || error.message?.includes('failed') || error.message?.includes('Authentication required')) {
          throw new Error('Authentication required. Please complete PIN/biometric verification.');
        }
        
        console.error('❌ PasskeyID connection failed:', error);
        console.error('❌ Full error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Clear storage on error
        LocalKeyStorage.clearAll();
        
        // Re-throw with user-friendly message
        throw new Error(error.message || 'Failed to connect with PasskeyID. Please try again.');
      }
    },

    signTransaction: async (
      xdr: string,
      opts?: {
        network?: string;
        networkPassphrase?: string;
        accountToSign?: string;
      }
    ) => {
      console.log('📝 Signing transaction with PasskeyID (C-address)...');
      
      try {
        const keyId = LocalKeyStorage.getPasskeyKeyId();
        if (!keyId) {
          throw new Error('No PasskeyID session found. Please reconnect your wallet.');
        }

        const contractId = LocalKeyStorage.getPasskeyContractId();
        if (!contractId) {
          throw new Error('No PasskeyID contract found. Please reconnect your wallet.');
        }

        // ⚠️ CRITICAL: Initialize account.wallet before signing
        initializeWallet(contractId);

        // Parse XDR to Transaction
        const networkPassphrase = opts?.networkPassphrase || activeChain.networkPassphrase!;
        const transaction = StellarSdk.TransactionBuilder.fromXDR(xdr, networkPassphrase) as StellarSdk.Transaction;
        
        console.log('🔐 Signing transaction with passkey (will prompt for biometric/PIN)...');
        
        // Convert transaction to format expected by passkey-kit
        const rpc = new StellarSdk.SorobanRpc.Server(
          process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
          { allowHttp: true }
        );
        
        // Prepare transaction (adds contract footprint)
        const preparedTx = await rpc.prepareTransaction(transaction);
        
        // Sign with passkey (triggers WebAuthn authentication)
        const signedTx = await account.sign(preparedTx as any, { keyId });
        
        // Return signed XDR
        const signedXdr = signedTx.toXDR();
        
        console.log('✅ Transaction signed successfully with PasskeyID');
        return signedXdr;
        
      } catch (error: any) {
        console.error('❌ PasskeyID transaction signing failed:', error);
        throw error;
      }
    },

    getWalletInfo: () => {
      return LocalKeyStorage.getWallet();
    },

    hasValidSession: () => {
      const keyId = LocalKeyStorage.getPasskeyKeyId();
      const contractId = LocalKeyStorage.getPasskeyContractId();
      const wallet = LocalKeyStorage.getWallet();
      return !!(keyId && contractId && wallet?.walletType === 'passkey');
    },

    disconnect: () => {
      LocalKeyStorage.clearAll();
      console.log('🔌 PasskeyID wallet disconnected');
    },

    getConnectionStatus: () => {
      return LocalKeyStorage.getConnectionStatus();
    }
  };
};

export default passkey;
