import { activeChain } from "./chain";
import { handleLogin, handleRegister, handleSign } from "./passkey";
import { LocalKeyStorage } from "./localKeyStorage";

// Helper function to refund existing account
const refundExistingAccount = async (publicKey: string) => {
  console.log('💰 Refunding existing account with friendbot...');
  try {
    const friendbotUrl = `https://friendbot.stellar.org?addr=${publicKey}`;
    console.log('🔗 Friendbot URL:', friendbotUrl);
    
    const response = await fetch(friendbotUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Account refunded successfully:', result);
      
      // Wait a moment for account to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify refunding worked
      const accountResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        console.log('🎯 Refunded account verified:', {
          publicKey: publicKey.substring(0, 8) + '...' + publicKey.substring(48),
          balances: accountData.balances
        });
      }
    } else {
      console.log('❌ Friendbot refunding failed:', response.status, response.statusText);
      throw new Error('Failed to refund existing account');
    }
  } catch (error) {
    console.error('❌ Account refunding error:', error);
    throw error;
  }
};

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
      const token = LocalKeyStorage.getToken();
      const wallet = LocalKeyStorage.getWallet();
      return !!(token && wallet?.walletType === 'passkey');
    },

    getNetworkDetails: async () => activeChain,

    getPublicKey: async () => {
      console.log('🔐 Getting PasskeyID public key...');
      
      try {
        // ALWAYS require WebAuthn authentication first - no bypassing
        console.log('🔑 Requiring WebAuthn biometric authentication...');
        let result;
        
        try {
          result = await handleLogin();
          console.log('✅ Successfully authenticated with existing passkey:', result);
        } catch (loginError) {
          console.log('📝 No existing passkey found, creating new one...', loginError);
          result = await handleRegister();
          console.log('✅ Successfully created new passkey:', result);
        }

        // Debug the result
        console.log('🔍 Result from passkey auth:', {
          result,
          hasResult: !!result,
          hasToken: !!(result?.token),
          hasPublicKey: !!(result?.publicKey),
          publicKey: result?.publicKey
        });

        if (!result) {
          throw new Error('PasskeyID authentication returned no result. Please try again.');
        }

        if (!result.token) {
          throw new Error('PasskeyID authentication returned no token. Please try again.');
        }

        if (!result.publicKey) {
          throw new Error('PasskeyID authentication returned no public key. Please try again.');
        }

        const { token, publicKey } = result;
        
        // Enhanced validation - only reject obvious mock keys
        console.log('🔍 Validating public key:', {
          publicKey,
          length: publicKey.length,
          startsWithG: publicKey.startsWith('G'),
          isAllX: publicKey === 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          isValid: publicKey.startsWith('G') && publicKey.length === 56 && publicKey !== 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        });
        
        // More precise validation
        if (!publicKey || typeof publicKey !== 'string') {
          throw new Error('Invalid public key: not a string');
        }
        
        if (!publicKey.startsWith('G')) {
          throw new Error(`Invalid public key: does not start with G (starts with: ${publicKey.substring(0, 1)})`);
        }
        
        if (publicKey.length !== 56) {
          throw new Error(`Invalid public key: wrong length (${publicKey.length}, should be 56)`);
        }
        
        // Only reject all-X mock keys
        if (publicKey === 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
          throw new Error('Invalid public key: still using all-X mock data');
        }

        // NOW check if this authenticated account needs refunding
        console.log('🔍 Checking if authenticated account needs refunding...');
        try {
          const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
          
          if (response.ok) {
            const accountData = await response.json();
            const hasBalance = accountData.balances?.some((balance: any) => 
              parseFloat(balance.balance) > 0
            );
            
            if (!hasBalance) {
              console.log('💰 Authenticated account exists but unfunded, refunding...');
              await refundExistingAccount(publicKey);
            } else {
              console.log('📱 Authenticated account is properly funded:', {
                publicKey: publicKey.substring(0, 8) + '...' + publicKey.substring(48),
                balances: accountData.balances?.length || 0
              });
            }
          } else {
            console.log('🔄 Authenticated account not found on testnet (reset), refunding...');
            await refundExistingAccount(publicKey);
          }
        } catch (error) {
          console.log('🔄 Error checking authenticated account, refunding just in case:', error);
          await refundExistingAccount(publicKey);
        }
        
        // Store token in localStorage (passkey-kit expects this)
        localStorage.setItem("token", token);
        localStorage.setItem("mock_passkey_token", token);
        LocalKeyStorage.storeToken(token);
        
        // Store wallet data locally
        LocalKeyStorage.storeWallet({
          publicKey,
          walletType: 'passkey',
          timestamp: Date.now(),
          token
        });

        // Store user data locally
        LocalKeyStorage.storeUser({
          id: publicKey,
          name: 'PasskeyID User',
          timestamp: Date.now(),
          walletConnected: true,
          token
        });

        console.log('🎉 PasskeyID connected successfully with authenticated Stellar account:', {
          publicKey: publicKey.substring(0, 8) + '...' + publicKey.substring(48),
          hasToken: !!token,
          length: publicKey.length
        });

        return publicKey;

      } catch (error: any) {
        console.error('❌ PasskeyID connection failed:', error);
        console.error('❌ Full error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Only clear if it's an actual authentication error
        if (!error.message?.includes('refunding')) {
          LocalKeyStorage.clearAll();
        }
        
        // Re-throw with user-friendly message
        throw new Error(error.message || 'Failed to connect with PasskeyID');
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
      console.log('📝 Signing transaction with PasskeyID...');
      
      try {
        const token = LocalKeyStorage.getToken();
        if (!token) {
          throw new Error('No PasskeyID session found. Please reconnect your wallet.');
        }

        const result = await handleSign(xdr, opts);
        
        if (!result) {
          throw new Error('Failed to sign transaction - no result returned');
        }
        
        console.log('✅ Transaction signed successfully with PasskeyID');
        return result;
        
      } catch (error: any) {
        console.error('❌ PasskeyID transaction signing failed:', error);
        throw error;
      }
    },

    getWalletInfo: () => {
      return LocalKeyStorage.getWallet();
    },

    hasValidSession: () => {
      const token = LocalKeyStorage.getToken();
      const wallet = LocalKeyStorage.getWallet();
      return !!(token && wallet?.walletType === 'passkey');
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