import { activeChain } from "./chain";
import { account, server, initializeWallet } from "./passkey-kit";
import { LocalKeyStorage } from "./localKeyStorage";
import * as StellarSdk from "@stellar/stellar-sdk";
import zionToken from "@/constants/zionToken";
import { accountToScVal } from "@/utils";

const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID || "";

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

const connectWithFactory = async (keyId?: string) => {
  if (!FACTORY_CONTRACT_ID) {
    throw new Error(
      'Passkey factory contract ID is not configured. Set NEXT_PUBLIC_FACTORY_CONTRACT_ID to enable recovery.'
    );
  }

  return account.connectWallet({
    keyId,
    walletPublicKey: FACTORY_CONTRACT_ID,
  });
};

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
      console.log('Getting PasskeyID public key (C-address)...');
      setPasskeyStatus(null);

      ensurePasskeyKitTimeout();

      try {
        const storedKeyId = LocalKeyStorage.getPasskeyKeyId();
        const storedContractId = LocalKeyStorage.getPasskeyContractId();

        // Returning user: localStorage has full session
        if (storedKeyId && storedContractId) {
          console.log('Found stored passkey session, reconnecting without WebAuthn prompt...');
          setPasskeyStatus(null);
          ensureLocalSession(storedContractId, storedKeyId);
          return storedContractId;
        }

        // If keyId exists but contractId is missing, resolve via factory
        if (storedKeyId && !storedContractId) {
          if (!FACTORY_CONTRACT_ID) {
            setPasskeyStatus('Factory contract missing - check environment');
            throw new Error(
              'Passkey factory contract ID is not configured. Cannot recover wallet without NEXT_PUBLIC_FACTORY_CONTRACT_ID.'
            );
          }

          console.log('Found stored keyId without contractId, resolving via factory...');
          setPasskeyStatus('Recovering wallet from passkey...');
          const connectResult: any = await connectWithFactory(storedKeyId);

          if (!connectResult?.keyIdBase64 || !connectResult?.contractId) {
            throw new Error('Passkey recovery returned incomplete data.');
          }

          persistSession(connectResult.contractId, connectResult.keyIdBase64);
          setPasskeyStatus(null);
          return connectResult.contractId;
        }

        // No local storage: try WebAuthn recovery via factory
        if (FACTORY_CONTRACT_ID) {
          console.log('No stored passkey data. Attempting WebAuthn recovery...');
          setPasskeyStatus('Recovering wallet from passkey...');

          try {
            const connectResult: any = await connectWithFactory();

            if (!connectResult?.keyIdBase64 || !connectResult?.contractId) {
              throw new Error('Passkey recovery returned incomplete data.');
            }

            persistSession(connectResult.contractId, connectResult.keyIdBase64);
            setPasskeyStatus(null);
            return connectResult.contractId;
          } catch (error: any) {
            if (isUserCancelledError(error)) {
              console.warn('Authentication cancelled or unavailable, creating new wallet...');
              setPasskeyStatus('No credential found - creating new wallet');
            } else if (!isNoCredentialError(error)) {
              throw error;
            } else {
              console.warn('No existing credential found, creating new wallet...');
              setPasskeyStatus('No credential found - creating new wallet');
            }
          }
        } else {
          console.warn('Factory contract ID not set. Proceeding with new wallet creation only.');
          setPasskeyStatus('Factory contract missing - check environment');
        }

        // FIRST-TIME CONNECTION: Create new wallet (WebAuthn registration handled by passkey-kit)
        console.log('Creating new passkey wallet...');

        const {
          keyIdBase64,
          contractId,
          signedTx,
        } = await account.createWallet(
          "ZI Playground",
          "User Wallet"
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
      LocalKeyStorage.clearAll();
      console.log('PasskeyID wallet disconnected');
    },

    getConnectionStatus: () => {
      return LocalKeyStorage.getConnectionStatus();
    }
  };
};

export default passkey;

