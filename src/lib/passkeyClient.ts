import { activeChain } from "./chain";
import { account, server, initializeWallet } from "./passkey-kit";
import { LocalKeyStorage } from "./localKeyStorage";
import * as StellarSdk from "@stellar/stellar-sdk";
import zionToken from "@/constants/zionToken";
import { accountToScVal } from "@/utils";

// Factory contract disabled to enable individual wallet accounts per PasskeyKit wallet
// const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID || "";

// Verify that no factory contract ID is loaded
const envFactoryId = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID;
if (envFactoryId) {
  console.warn('⚠️ FACTORY CONTRACT STILL DETECTED:', envFactoryId.substring(0, 8) + '...');
  console.warn('⚠️ This will cause shared G-addresses instead of individual wallets!');
} else {
  console.log('✅ Factory contract disabled - individual wallets enabled');
}

// Flag to track when we're connecting to an existing wallet vs creating new
let connectingToExistingWallet = false;
let existingWalletContractId: string | null = null;

// Flag to track when we're creating a named wallet vs other operations  
let creatingNamedWallet = false;

// Debug: Log that factory contract is disabled
console.log('PasskeyKit running in INDIVIDUAL WALLET mode (no shared factory)');

// Make wallet debugging available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).debugWallet = async () => {
    const { debugWalletAddresses } = await import('./walletManager');
    return await debugWalletAddresses();
  };
  
  // NEW: Helper to check if a Stellar account exists
  (window as any).checkAccount = async (address: string) => {
    console.log(`🔍 Checking account: ${address.substring(0, 8)}...`);
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Account exists with ${data.balances.length} balance(s)`);
        data.balances.forEach((balance: any) => {
          console.log(`  - ${balance.balance} ${balance.asset_type === 'native' ? 'XLM' : balance.asset_code}`);
        });
        return true;
      } else if (response.status === 404) {
        console.log(`❌ Account does not exist - needs funding first`);
        console.log(`🔗 Fund with: https://friendbot.stellar.org/?addr=${address}`);
        return false;
      } else {
        console.log(`⚠️ Error checking account:`, response.status);
        return false;
      }
    } catch (error: any) {
      console.log(`❌ Failed to check account:`, error.message);
      return false;
    }
  };
  (window as any).testContractAddresses = async () => {
    console.log('🧪 Testing individual contract G-addresses:');
    const { getStoredWallets } = await import('./walletManager');
    const wallets = getStoredWallets();
    
    for (const wallet of wallets) {
      try {
        console.log(`\n📝 Wallet: ${wallet.name}`);
        console.log(`📝 Contract ID: ${wallet.contractId}`);
        
        // Try to derive the G-address from the C-address using Stellar SDK
        try {
          const contractAddress = StellarSdk.Address.contract(wallet.contractId);
          console.log(`🔍 Address object:`, contractAddress);
          
          // Try to get the underlying account
          const accountId = contractAddress.toString();
          console.log(`📍 Account ID: ${accountId}`);
          
        } catch (addressError: any) {
          console.log(`❌ Address derivation failed:`, addressError.message);
        }
        
      } catch (error: any) {
        console.log(`❌ Error analyzing ${wallet.name}:`, error.message);
      }
    }
  };
  
  // NEW: Test function to clear all wallets and check G-address consistency
  (window as any).testGAddressPersistence = async () => {
    console.log('🧪 Testing G-Address persistence after wallet deletion:');
    
    // Store current G-address
    const currentGAddress = (account as any).walletPublicKey;
    console.log('📝 Current G-Address:', currentGAddress?.substring(0, 8) + '...');
    
    // Get current wallet count
    const { getStoredWallets, clearAllWallets } = await import('./walletManager');
    const currentWallets = getStoredWallets();
    console.log('📝 Current wallets:', currentWallets.length);
    
    // Clear all wallets (UI level)
    console.log('🗑️ Clearing all wallets...');
    clearAllWallets();
    
    // Check if G-address persists in PasskeyKit
    const afterClearGAddress = (account as any).walletPublicKey;
    console.log('📝 G-Address after clearing wallets:', afterClearGAddress?.substring(0, 8) + '...');
    
    return {
      before: currentGAddress,
      after: afterClearGAddress,
      persistent: currentGAddress === afterClearGAddress
    };
  };
}

/**
 * Set flag to indicate we're connecting to an existing wallet
 * This prevents getPublicKey from creating a new wallet
 */
export const setConnectingToExistingWallet = (contractId: string) => {
  connectingToExistingWallet = true;
  existingWalletContractId = contractId;
  
  // Clear the disconnect flag so it doesn't interfere with existing wallet connection
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('passkey_user_disconnected');
  }
  
  console.log('📋 Set connecting to existing wallet:', contractId.substring(0, 8) + '...');
};
// Function to set flag when creating named wallet
export const setCreatingNamedWallet = (isCreating: boolean) => {
  creatingNamedWallet = isCreating;
};
/**
 * Clear the existing wallet connection flag
 */
export const clearExistingWalletConnection = () => {
  connectingToExistingWallet = false;
  existingWalletContractId = null;
  console.log('🧹 Cleared existing wallet connection flag');
};

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

const ensurePasskeyKitTimeout = () => {
  const timeoutValue = (account as any).timeoutInSeconds;
  if (!timeoutValue || timeoutValue !== 25) {
    console.warn('timeoutInSeconds not set correctly, setting to 25...');
    (account as any).timeoutInSeconds = 25;
  }
};

const isUserCancelledError = (error: any) => {
  if (error?.name === 'NotAllowedError') {
    return true;
  }
  const message = (error?.message || '').toLowerCase();
  return message.includes('cancel') || message.includes('aborted') || message.includes('not allowed');
};

const isNoCredentialError = (error: any) => {
  const message = (error?.message || '').toLowerCase();
  return message.includes('no credential') ||
    message.includes('credential not found') ||
    message.includes('no credentials') ||
    message.includes('not registered');
};

// Factory connection disabled - using individual wallets only
// const connectWithFactory = async (keyId?: string) => {
//   throw new Error('Factory mode disabled - each wallet uses its own contract');
// };

const persistSession = (contractId: string, keyIdBase64: string) => {
  LocalKeyStorage.storePasskeyKeyId(keyIdBase64);
  LocalKeyStorage.storePasskeyContractId(contractId);

  initializeWallet(contractId);

  const token = `passkey_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  LocalKeyStorage.storeToken(token);

  LocalKeyStorage.storeWallet({
    publicKey: contractId,
    walletType: 'passkey',
    timestamp: Date.now(),
    token,
  });

  LocalKeyStorage.storeUser({
    id: contractId,
    name: 'PasskeyID User',
    timestamp: Date.now(),
    walletConnected: true,
    token,
  });

  return token;
};

const ensureLocalSession = (contractId: string, keyId: string | null) => {
  initializeWallet(contractId);

  let token = LocalKeyStorage.getToken();
  if (!token) {
    token = `passkey_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    LocalKeyStorage.storeToken(token);
  }

  LocalKeyStorage.storeWallet({
    publicKey: contractId,
    walletType: 'passkey',
    timestamp: Date.now(),
    token,
  });

  LocalKeyStorage.storeUser({
    id: contractId,
    name: 'PasskeyID User',
    timestamp: Date.now(),
    walletConnected: true,
    token,
  });

  if (keyId) {
    LocalKeyStorage.storePasskeyKeyId(keyId);
  }
};
const setPasskeyStatus = (status: string | null) => {
  if (status) {
    LocalKeyStorage.storePasskeyStatus(status);
  } else {
    LocalKeyStorage.clearPasskeyStatus();
  }
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
      await rpc.simulateTransaction(tx);
      console.log('ZION token balance storage initialized (simulated)');
    } catch (simError: any) {
      // If simulation fails, try to actually call balance with signing
      // This will create the storage entry
      console.log('Balance simulation failed, attempting to initialize with signed transaction...');

      // Prepare transaction
      const preparedTx = await rpc.prepareTransaction(tx);

      // Sign with passkey
      const signedTx = await account.sign(preparedTx as any, { keyId });

      // Send via PasskeyServer (LaunchTube)
      try {
        await server.send(signedTx);
        console.log('ZION token balance initialization transaction submitted successfully');
      } catch (sendError: any) {
        // If LaunchTube fails, try direct RPC
        console.warn('LaunchTube submission failed, trying direct RPC...');
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
        await sendToRpcDirectly(signedTx, rpcUrl);
        console.log('ZION token balance initialization submitted via direct RPC');
      }
    }

    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error: any) {
    console.error('Failed to initialize ZION token trustline:', error);
    throw error;
  }
}

/**
 * PasskeyID Wallet Connector for SorobanReact
 * Implements smart contract wallet (C-address) using passkey-kit
 */
const passkey = () => {
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
      console.log('🚀 passkeyClient.getPublicKey() called');
      setPasskeyStatus(null);

      ensurePasskeyKitTimeout();

      // If we're creating a named wallet, don't create another one here
      if (creatingNamedWallet) {
        console.log('⚠️ BLOCKED: Skipping getPublicKey() because named wallet creation is in progress');
        throw new Error('Named wallet creation in progress - blocked to prevent duplicate contracts');
      }

    // Check if we're connecting to an existing wallet first
    if (connectingToExistingWallet && existingWalletContractId) {
      console.log('🔄 Connecting to existing wallet with WebAuthn authentication...');
      const contractId = existingWalletContractId;
      
      // Try to get the specific keyId for this wallet from wallet manager
      const walletManager = await import('./walletManager');
      const wallets = walletManager.getStoredWallets();
      const targetWallet = wallets.find(w => w.contractId === contractId);
      
      if (targetWallet && targetWallet.keyId) {
        console.log('🔑 Found wallet, triggering WebAuthn authentication...');
        
        try {
          // Convert base64url to base64 for atob()
          const base64KeyId = targetWallet.keyId
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          
          // Add padding if needed
          const paddedKeyId = base64KeyId + '='.repeat((4 - base64KeyId.length % 4) % 4);
          
          // Trigger WebAuthn authentication for this specific wallet
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32), // Simple challenge
              allowCredentials: [{
                type: 'public-key',
                id: Uint8Array.from(atob(paddedKeyId), c => c.charCodeAt(0))
              }],
              userVerification: 'required'
            }
          });
          
          if (credential) {
            console.log('✅ WebAuthn authentication successful for existing wallet');
            
            // Set up the session with the correct keyId for this wallet
            LocalKeyStorage.storePasskeyKeyId(targetWallet.keyId);
            LocalKeyStorage.storePasskeyContractId(contractId);
            
            setPasskeyStatus(null);
            ensureLocalSession(contractId, targetWallet.keyId);
            clearExistingWalletConnection(); // Clear flag after successful connection
            return contractId;
          }
        } catch (authError: any) {
          console.warn('⚠️ WebAuthn authentication failed:', authError.message);
          clearExistingWalletConnection();
          throw new Error('Authentication required. Please complete PIN/biometric verification.');
        }
      } else {
        console.warn('⚠️ Wallet not found in storage or missing keyId');
        clearExistingWalletConnection();
        // Fall through to normal connection flow
      }
    }

      try {
        const storedKeyId = LocalKeyStorage.getPasskeyKeyId();
        const storedContractId = LocalKeyStorage.getPasskeyContractId();
        
        // Debug: Log what we find in storage
        console.log('🔍 Storage check:', {
          keyId: storedKeyId ? storedKeyId.substring(0, 16) + '...' : 'null',
          contractId: storedContractId ? storedContractId.substring(0, 8) + '...' : 'null',
          sessionFlags: {
            recovery: typeof window !== 'undefined' ? sessionStorage.getItem('passkey_recovery_attempted') : 'N/A',
            createNew: typeof window !== 'undefined' ? sessionStorage.getItem('passkey_create_new_requested') : 'N/A'
          }
        });

        // Returning user: localStorage has full session
        // But first check if user just disconnected - don't auto-reconnect immediately
        const justDisconnected = typeof window !== 'undefined' && 
          sessionStorage.getItem('passkey_user_disconnected') === 'true';
          
        if (storedKeyId && storedContractId && !justDisconnected) {
          console.log('Found stored passkey session, using independent wallet contract:', storedContractId.substring(0, 8) + '...');
          
          setPasskeyStatus(null);
          ensureLocalSession(storedContractId, storedKeyId);
          return storedContractId;
        } else if (storedKeyId && storedContractId && justDisconnected) {
          console.log('Found stored session but user just disconnected - requiring fresh choice...');
          // Clear only session data, preserve wallet metadata
          LocalKeyStorage.storeToken('');
          LocalKeyStorage.storeWallet(null as any);
          LocalKeyStorage.storeUser(null as any);
          localStorage.removeItem('zi_passkey_keyId');
          localStorage.removeItem('zi_passkey_contractId');
        }

        // If keyId exists but contractId is missing, this shouldn't happen in normal operation
        // Each wallet should have both keyId and contractId stored together
        if (storedKeyId && !storedContractId) {
          console.warn('Found keyId without contractId - this indicates corrupted storage');
          setPasskeyStatus('Wallet storage corrupted - please recreate wallet');
          throw new Error('Wallet storage is corrupted. Please create a new wallet.');
        }

        // No local storage available - user needs to create a new wallet
        // Factory recovery has been disabled to ensure each wallet gets its own unique G-address
        console.log('No stored wallet session found - user must create a new wallet');
        setPasskeyStatus('Creating new wallet...');

        // FIRST-TIME CONNECTION: Create new wallet (WebAuthn registration handled by passkey-kit)
        console.log('Creating new passkey wallet...');
        
        // Mark that user is intentionally creating new wallet
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('passkey_create_new_requested', 'true');
          // Clear disconnect flag since user is choosing to create new
          sessionStorage.removeItem('passkey_user_disconnected');
        }

        // Default wallet name if none provided
        const walletName = typeof window !== 'undefined' && 
          sessionStorage.getItem('passkey_new_wallet_name') || 'ZI Wallet';

        const {
          keyIdBase64,
          contractId,
          signedTx,
        } = await account.createWallet(
          "ZI Playground",
          walletName
        );

        console.log('Wallet created:', {
          keyId: keyIdBase64.substring(0, 16) + '...',
          contractId: contractId.substring(0, 8) + '...' + contractId.substring(contractId.length - 8),
        });

        // Submit wallet creation transaction
        console.log('Submitting wallet creation transaction...');

        try {
          // Try LaunchTube first
          console.log('Attempting submission via LaunchTube...');
          await server.send(signedTx);
          console.log('Wallet creation transaction submitted via LaunchTube');
        } catch (launchtubeError: any) {
          const errorMsg = launchtubeError?.error || launchtubeError?.message || '';
          const isTimeBoundsError = errorMsg.includes('timeBounds') ||
            errorMsg.includes('maxTime') ||
            errorMsg.includes('too far');

          console.warn('LaunchTube submission failed:', errorMsg);

          if (isTimeBoundsError) {
            console.log('Timebounds error detected. Ensure timeoutInSeconds is 25 seconds.');
          }

          // Fallback to direct RPC submission
          console.log('Falling back to direct RPC submission...');
          try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
            const result = await sendToRpcDirectly(signedTx, rpcUrl);
            console.log('Wallet creation transaction submitted via direct RPC:', result);
          } catch (rpcError: any) {
            console.error('Direct RPC submission also failed:', rpcError);

            // Check if contract might already be deployed despite errors
            const rpc = new StellarSdk.SorobanRpc.Server(
              process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
              { allowHttp: true }
            );

            try {
              console.log('Checking if contract was deployed anyway...');
              await rpc.getContractData(
                contractId,
                StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance()
              );
              console.log('Contract exists on-chain despite submission error!');
            } catch (checkError) {
              console.error('Contract not found on-chain');
              throw new Error(
                'Failed to deploy wallet contract. This is likely due to transaction timebounds being too far in the future. ' +
                'LaunchTube requires maxTime within 30 seconds. ' +
                'Please ensure passkey-kit is configured with timeoutInSeconds: 25'
              );
            }
          }
        }

        // Store credentials locally
        persistSession(contractId, keyIdBase64);

        setPasskeyStatus(null);

        console.log('PasskeyID wallet created and connected successfully:', {
          contractId: contractId.substring(0, 8) + '...' + contractId.substring(contractId.length - 8),
          isCAddress: contractId.startsWith('C'),
        });

        // Fund wallet with XLM from friendbot (testnet only)
        const isTestnet = (process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "").includes("Test");
        if (isTestnet) {
          console.log('Funding passkey wallet with XLM from friendbot...');
          try {
            // Wait a moment for the contract to be fully deployed
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('🏦 Checking wallet contract before funding:', {
              contractId: contractId.substring(0, 8) + '...',
              friendbotUrl: `https://friendbot.stellar.org/?addr=${contractId}`
            });

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
              console.log('Wallet funded successfully via friendbot:', {
                contractId: contractId.substring(0, 8) + '...',
                transactionHash: friendbotResult.hash || 'N/A',
              });
              
              // Verify funding by checking account existence
              try {
                // Wait longer for both contract deployment and funding to propagate
                console.log('⏳ Waiting for contract deployment and funding to propagate...');
                await new Promise(resolve => setTimeout(resolve, 10000)); // Even longer wait
                
                const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                  try {
                    const accountData = await server.loadAccount(contractId);
                    const nativeBalance = accountData.balances.find(b => b.asset_type === 'native');
                    console.log('✅ Post-funding verification:', {
                      accountExists: true,
                      nativeBalance: nativeBalance?.balance || '0',
                      sequence: accountData.sequence,
                      attempt: attempts + 1
                    });
                    break; // Success - exit retry loop
                  } catch (retryError: any) {
                    attempts++;
                    if (attempts < maxAttempts) {
                      console.log(`⚠️ Verification attempt ${attempts} failed, retrying in 5 seconds...`);
                      await new Promise(resolve => setTimeout(resolve, 5000));
                    } else {
                      throw retryError;
                    }
                  }
                }
              } catch (verifyError: any) {
                // Don't fail on verification errors - the contract might still be deploying
                console.warn('⚠️ Could not verify funding immediately:', verifyError.message);
                console.log('💡 This is normal - the contract may still be deploying on testnet');
                console.log('🔗 Check contract manually at: https://stellar.expert/explorer/testnet/contract/' + contractId);
              }
            } else {
              // Friendbot might return an error if account already exists or rate limited
              const errorText = await friendbotResponse.text().catch(() => 'Unknown error');
              console.warn('Friendbot funding response:', {
                status: friendbotResponse.status,
                statusText: friendbotResponse.statusText,
                error: errorText.substring(0, 100),
              });
              // Don't throw - wallet creation was successful, funding is optional
            }
          } catch (fundingError: any) {
            // Don't fail wallet creation if funding fails
            console.warn('Friendbot funding failed (non-critical):', fundingError.message);
            console.log('Wallet was created successfully. You can fund it manually if needed.');
          }
        } else {
          console.log('Skipping friendbot funding (not on testnet)');
        }

        // Initialize ZION token trustline/balance for the new passkey wallet
        try {
          console.log('Initializing ZION token trustline/balance for passkey wallet...');
          await initializeZionTokenTrustline(contractId, keyIdBase64);
          console.log('ZION token trustline/balance initialized successfully');
        } catch (trustlineError: any) {
          // Don't fail wallet creation if trustline initialization fails
          console.warn('ZION token trustline initialization failed (non-critical):', trustlineError.message);
          console.log('Wallet was created successfully. You can initialize the trustline manually if needed.');
        }

        return contractId;

      } catch (error: any) {
        if (isUserCancelledError(error)) {
          throw new Error('Authentication required. Please complete PIN/biometric verification.');
        }

        console.error('PasskeyID connection failed:', error);
        console.error('Full error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        // Clear only session data on error, preserve wallet metadata
        LocalKeyStorage.storeToken('');
        LocalKeyStorage.storeWallet(null as any);
        LocalKeyStorage.storeUser(null as any);
        localStorage.removeItem('zi_passkey_keyId');
        localStorage.removeItem('zi_passkey_contractId');

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
        submitToLaunchTube?: boolean;
      }
    ) => {
      console.log('Signing transaction with PasskeyID (C-address)...');

      try {
        const keyId = LocalKeyStorage.getPasskeyKeyId();
        if (!keyId) {
          throw new Error('No PasskeyID session found. Please reconnect your wallet.');
        }

        const contractId = LocalKeyStorage.getPasskeyContractId();
        if (!contractId) {
          throw new Error('No PasskeyID contract found. Please reconnect your wallet.');
        }

        // CRITICAL: Initialize account.wallet before signing
        initializeWallet(contractId);

        // Parse XDR to Transaction
        const networkPassphrase = opts?.networkPassphrase || activeChain.networkPassphrase!;
        const transaction = StellarSdk.TransactionBuilder.fromXDR(xdr, networkPassphrase) as StellarSdk.Transaction;

        console.log('Signing transaction with passkey (will prompt for biometric/PIN)...');

        // Convert transaction to format expected by passkey-kit
        const rpc = new StellarSdk.SorobanRpc.Server(
          process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
          { allowHttp: true }
        );

        // Prepare transaction (adds contract footprint)
        const preparedTx = await rpc.prepareTransaction(transaction);

        // Sign with passkey (triggers WebAuthn authentication)
        const signedTx = await account.sign(preparedTx as any, { keyId });

        const shouldSubmit = opts?.submitToLaunchTube !== false;
        if (shouldSubmit) {
          console.log('Submitting transaction via PasskeyServer...');
          await server.send(signedTx);
        }

        // Return signed XDR
        const signedXdr = signedTx.toXDR();

        console.log('Transaction signed successfully with PasskeyID');
        return signedXdr;

      } catch (error: any) {
        console.error('PasskeyID transaction signing failed:', error);
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
      console.log('🔄 Disconnect called - clearing session data but preserving wallets...');
      
      // Debug: Show what's in storage before clearing
      console.log('📦 Pre-disconnect storage:', {
        keyId: LocalKeyStorage.getPasskeyKeyId(),
        contractId: LocalKeyStorage.getPasskeyContractId(),
        wallet: LocalKeyStorage.getWallet(),
        allKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : []
      });

      // Clear PasskeyKit instance state first
      try {
        if (account) {
          (account as any).wallet = null;
          (account as any).keyId = null;
          (account as any).contractId = null;
          // Clear any internal state that might exist
          if ((account as any).activeSession) {
            (account as any).activeSession = null;
          }
          console.log('✅ PasskeyKit instance cleared');
        }
      } catch (error) {
        console.warn('⚠️ Could not clear PasskeyKit instance:', error);
      }
      
      // Clear only session data (NOT wallet metadata)
      if (typeof window !== 'undefined') {
        // Clear session tokens and connection state
        LocalKeyStorage.storeToken('');
        LocalKeyStorage.storeWallet(null as any);
        LocalKeyStorage.storeUser(null as any);
        
        // Clear passkey session data
        localStorage.removeItem('zi_passkey_keyId');
        localStorage.removeItem('zi_passkey_contractId');
        localStorage.removeItem('zi_wallet_data');
        localStorage.removeItem('zi_user_data');
        localStorage.removeItem('zi_auth_token');
        localStorage.removeItem('passkey_status');
        
        console.log('✅ Session data cleared, wallet list preserved');
        
        // Set a flag indicating user intentionally disconnected
        sessionStorage.setItem('passkey_user_disconnected', 'true');
      }
      
      // Verify clearing worked
      const keyIdAfter = LocalKeyStorage.getPasskeyKeyId();
      const contractIdAfter = LocalKeyStorage.getPasskeyContractId();
      const walletAfter = LocalKeyStorage.getWallet();
      
      console.log('🔍 After disconnect verification:', {
        keyId: keyIdAfter ? 'STILL EXISTS!' : 'cleared',
        contractId: contractIdAfter ? 'STILL EXISTS!' : 'cleared', 
        wallet: walletAfter ? 'STILL EXISTS!' : 'cleared',
        walletsPreserved: typeof window !== 'undefined' ? !!localStorage.getItem('localhost_zi_passkey_wallets') : 'N/A'
      });
      
      console.log('✅ PasskeyID wallet disconnected - session cleared, wallets preserved');
    },

    getConnectionStatus: () => {
      return LocalKeyStorage.getConnectionStatus();
    }
  };
};

export default passkey;

/**
 * Utility function to request explicit passkey recovery
 * Call this to force passkey recovery attempt even after recent disconnect
 */
export const requestPasskeyRecovery = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('passkey_recovery_attempted', 'true');
    sessionStorage.removeItem('passkey_create_new_requested');
    sessionStorage.removeItem('passkey_user_disconnected');
    console.log('Passkey recovery requested - next connection attempt will try to recover existing passkeys');
  }
};

/**
 * Utility function to request new wallet creation
 * Call this to skip recovery and force new wallet creation
 */
export const requestNewWalletCreation = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('passkey_create_new_requested', 'true');
    sessionStorage.removeItem('passkey_recovery_attempted');
    sessionStorage.removeItem('passkey_user_disconnected');
    console.log('New wallet creation requested - next connection attempt will create new wallet');
  }
};

/**
 * Utility function to set the name for the next wallet creation
 */
export const setWalletCreationName = (name: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('passkey_new_wallet_name', name);
  }
};

