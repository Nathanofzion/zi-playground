import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { LocalKeyStorage } from "./localKeyStorage";
import { 
  Keypair, 
  Networks, 
  TransactionBuilder, 
  Transaction,
  Horizon
} from "@stellar/stellar-sdk";

// Use local-only implementation with real Stellar accounts
const LOCAL_MODE = true;

// Stellar testnet configuration
const STELLAR_TESTNET_URL = "https://horizon-testnet.stellar.org";
const STELLAR_NETWORK = Networks.TESTNET;
const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Generate a proper challenge
const generateChallenge = (): string => {
  const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...challengeBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate a proper user ID
const generateUserId = (): string => {
  const userIdBytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...userIdBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Helper function to format balance information
const formatBalances = (balances: Horizon.AccountResponse["balances"]) => {
  return balances.map(balance => {
    // Type-safe way to handle different balance types
    const balanceAmount = 'balance' in balance ? balance.balance : '0';
    
    switch (balance.asset_type) {
      case 'native':
        return {
          asset: 'XLM',
          balance: balanceAmount
        };
      case 'credit_alphanum4':
      case 'credit_alphanum12':
        return {
          asset: balance.asset_code || 'UNKNOWN',
          balance: balanceAmount
        };
      case 'liquidity_pool_shares':
        return {
          asset: 'LP_SHARES',
          balance: balanceAmount
        };
      default:
        return {
          asset: 'UNKNOWN',
          balance: balanceAmount
        };
    }
  });
};

// Create real Stellar keypair and fund with friendbot (with enhanced debugging)
const generateStellarAccount = async () => {
  try {
    console.log('🌟 Generating real Stellar testnet account...');
    
    // Step 1: Generate new Stellar keypair
    console.log('📝 Step 1: Generating keypair...');
    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();
    
    console.log('✅ Keypair generated:', {
      publicKey: publicKey,
      secretLength: secretKey.length,
      startsWithS: secretKey.startsWith('S'),
      startsWithG: publicKey.startsWith('G')
    });
    
    // Step 2: Fund account using friendbot
    console.log('💰 Step 2: Funding account with friendbot...');
    console.log('🔗 Friendbot URL:', `${FRIENDBOT_URL}?addr=${publicKey}`);
    
    const friendbotResponse = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📡 Friendbot response status:', friendbotResponse.status);
    console.log('📡 Friendbot response headers:', Object.fromEntries(friendbotResponse.headers.entries()));
    
    if (!friendbotResponse.ok) {
      const errorText = await friendbotResponse.text();
      console.error('❌ Friendbot error response:', errorText);
      throw new Error(`Friendbot funding failed: ${friendbotResponse.status} ${friendbotResponse.statusText}\nError: ${errorText}`);
    }
    
    let friendbotResult;
    try {
      friendbotResult = await friendbotResponse.json();
      console.log('✅ Friendbot success response:', friendbotResult);
    } catch (jsonError) {
      const responseText = await friendbotResponse.text();
      console.log('⚠️ Friendbot non-JSON response:', responseText);
      friendbotResult = { message: 'Account funded (non-JSON response)', responseText };
    }
    
    // Step 3: Wait a moment for the account to be created on the network
    console.log('⏳ Step 3: Waiting 2 seconds for account creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Verify account exists on testnet
    console.log('🔍 Step 4: Verifying account on testnet...');
    console.log('🔗 Horizon URL:', STELLAR_TESTNET_URL);
    
    const server = new Horizon.Server(STELLAR_TESTNET_URL);
    
    let account;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🔄 Account verification attempt ${attempts}/${maxAttempts}...`);
        
        account = await server.loadAccount(publicKey);
        console.log('✅ Account verification successful!');
        break;
        
      } catch (loadError: any) {
        console.warn(`⚠️ Attempt ${attempts} failed:`, loadError.message);
        
        if (attempts < maxAttempts) {
          console.log('⏳ Waiting 3 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.error('❌ All account verification attempts failed');
          throw new Error(`Account verification failed after ${maxAttempts} attempts: ${loadError.message}`);
        }
      }
    }
    
    if (!account) {
      throw new Error('Account verification failed - no account loaded');
    }
    
    // Format balances safely
    const formattedBalances = formatBalances(account.balances);
    
    console.log('🎯 Account verified on testnet:', {
      publicKey: publicKey,
      accountId: account.accountId(),
      sequence: account.sequenceNumber(),
      balances: formattedBalances
    });
    
    return { 
      publicKey, 
      secretKey,
      accountId: account.accountId(),
      sequence: account.sequenceNumber(),
      balances: formattedBalances
    };
    
  } catch (error: any) {
    console.error('❌ Complete error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Account generation failed: ${error.message}`);
  }
};

export const handleRegister = async () => {
  try {
    console.log('🆕 Starting PasskeyID registration...');
    
    if (LOCAL_MODE) {
      console.log('🔧 Using local-only PasskeyID registration with real Stellar accounts');
      
      // Create registration options
      const challenge = generateChallenge();
      const userId = generateUserId();
      
      const registrationOptions = {
        challenge,
        rp: {
          name: "zi-playground",
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
          userVerification: "required" as const,
          requireResidentKey: false
        }
      };

      console.log('📋 Starting WebAuthn registration...');
      const regResponse = await startRegistration({ optionsJSON: registrationOptions });
      
      if (!regResponse) {
        throw new Error('Registration was cancelled or failed');
      }

      console.log('✅ WebAuthn registration completed');

      // Generate real Stellar account and fund it
      console.log('🚀 Starting Stellar account generation...');
      const stellarAccount = await generateStellarAccount();
      const token = `local_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store passkey mapping locally with real Stellar data
      const passkeyData = {
        credentialId: regResponse.id,
        publicKey: stellarAccount.publicKey,
        secretKey: stellarAccount.secretKey, // Store securely in real implementation
        token,
        rawId: regResponse.rawId,
        response: regResponse.response,
        challenge,
        userId,
        stellarData: {
          accountId: stellarAccount.accountId,
          sequence: stellarAccount.sequence,
          network: 'testnet',
          fundedAt: Date.now(),
          balances: stellarAccount.balances
        },
        createdAt: Date.now()
      };

      // Store in LocalKeyStorage for persistence
      LocalKeyStorage.storePasskeyData(regResponse.id, passkeyData);

      console.log('🎉 PasskeyID registration completed successfully with real Stellar account!');
      
      return {
        token,
        publicKey: stellarAccount.publicKey
      };
    }

    // Fallback to Supabase (if needed in future)
    throw new Error('Supabase mode not implemented for registration');
    
  } catch (error: any) {
    console.error('❌ PasskeyID registration error:', error);
    throw error;
  }
};

export const handleLogin = async () => {
  try {
    console.log('🔑 Starting PasskeyID authentication...');
    
    if (LOCAL_MODE) {
      console.log('🔧 Using local-only PasskeyID authentication');

      // Check if we have any stored passkey data
      const storedPasskeys = LocalKeyStorage.getAllPasskeyData();
      
      if (Object.keys(storedPasskeys).length === 0) {
        console.log('📝 No existing passkeys found');
        throw new Error('No existing passkeys found - will trigger registration');
      }

      // Create authentication options
      const challenge = generateChallenge();
      
      const authOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: "required" as const,
        allowCredentials: Object.keys(storedPasskeys).map(credId => ({
          id: credId,
          type: "public-key" as const
        }))
      };

      console.log('📋 Starting WebAuthn authentication...');
      const authResponse = await startAuthentication({ optionsJSON: authOptions });
      
      if (!authResponse) {
        throw new Error('Authentication was cancelled or failed');
      }

      console.log('✅ WebAuthn authentication completed');

      // Find the passkey data for this credential
      const passkeyData = storedPasskeys[authResponse.id];
      if (!passkeyData) {
        throw new Error('Passkey data not found for this credential');
      }

      // Verify the Stellar account still exists
      try {
        const server = new Horizon.Server(STELLAR_TESTNET_URL);
        const account = await server.loadAccount(passkeyData.publicKey);
        
        console.log('✅ Stellar account verified:', {
          publicKey: passkeyData.publicKey,
          balances: account.balances.length
        });
        
        // Update stellar data
        passkeyData.stellarData = {
          ...passkeyData.stellarData,
          sequence: account.sequenceNumber(),
          lastVerified: Date.now()
        };
        
      } catch (stellarError) {
        console.warn('⚠️ Could not verify Stellar account (may be unfunded):', stellarError);
      }

      // Update last used timestamp
      passkeyData.lastUsed = Date.now();
      LocalKeyStorage.storePasskeyData(authResponse.id, passkeyData);

      console.log('✅ PasskeyID authentication completed successfully');
      
      return {
        token: passkeyData.token,
        publicKey: passkeyData.publicKey
      };
    }

    // Fallback to Supabase (if needed in future)
    throw new Error('Supabase mode not implemented for authentication');
    
  } catch (error: any) {
    console.error('❌ PasskeyID authentication error:', error);
    throw error;
  }
};

export const handleSign = async (
  xdr: string,
  opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }
) => {
  try {
    console.log('📝 Signing transaction with PasskeyID...');
    
    if (LOCAL_MODE) {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error('No PasskeyID token found. Please reconnect your wallet.');
      }

      // Get the current passkey data to retrieve secret key
      const storedPasskeys = LocalKeyStorage.getAllPasskeyData();
      const currentPasskey = Object.values(storedPasskeys).find(p => p.token === token);
      
      if (!currentPasskey || !currentPasskey.secretKey) {
        throw new Error('No secret key found for transaction signing. Please reconnect your wallet.');
      }

      console.log('🔐 Signing transaction with real Stellar keypair...');
      
      // Use provided network passphrase or fallback to default
      // This is critical for multi-network support (testnet, mainnet, futurenet)
      const networkPassphrase = opts?.networkPassphrase || STELLAR_NETWORK;
      console.log('🌐 Using network passphrase:', networkPassphrase === STELLAR_NETWORK ? 'TESTNET (default)' : 'Custom');
      
      // Parse transaction from XDR with correct network passphrase
      const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase) as Transaction;
      
      // Create keypair from stored secret
      const signerKeypair = Keypair.fromSecret(currentPasskey.secretKey);
      
      // Sign the transaction
      transaction.sign(signerKeypair);
      
      // Return signed XDR
      const signedXdr = transaction.toXDR();
      
      console.log('✅ Transaction signed successfully with PasskeyID');
      return signedXdr;
    }

    throw new Error('Transaction signing not implemented for non-local mode');
    
  } catch (error: any) {
    console.error('❌ PasskeyID signing error:', error);
    throw error;
  }
};