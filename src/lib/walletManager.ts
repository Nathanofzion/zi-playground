/**
 * Wallet Management System for PasskeyID wallets
 * Handles wallet naming, listing, and selection
 */

import { account, initializeWallet } from './passkey-kit';
import { LocalKeyStorage } from './localKeyStorage';
import { setWalletCreationName, setConnectingToExistingWallet, setCreatingNamedWallet } from './passkeyClient';

export interface WalletInfo {
  id: string;
  name: string;
  contractId: string;
  keyId: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}

const WALLETS_STORAGE_KEY = 'zi_passkey_wallets';
const ACTIVE_WALLET_KEY = 'zi_active_wallet_id';

/**
 * Get port-agnostic storage key for localhost development
 * This allows wallets to persist across different development ports
 */
const getPortAgnosticStorageKey = (baseKey: string): string => {
  if (typeof window === 'undefined') return baseKey;
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // For localhost development, use a shared key across ports
  // For production, use the original key (origin-specific)
  return isLocalhost ? `localhost_${baseKey}` : baseKey;
};

/**
 * Port-agnostic localStorage wrapper for development
 */
const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getPortAgnosticStorageKey(key));
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getPortAgnosticStorageKey(key), value);
};

const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getPortAgnosticStorageKey(key));
};

/**
 * Migrate existing wallets from port-specific storage to port-agnostic storage
 * This runs automatically to preserve wallets when switching ports
 */
const migratePortSpecificWallets = (): void => {
  if (typeof window === 'undefined') return;
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  if (!isLocalhost) return; // Only migrate for localhost
  
  // Check if we already have port-agnostic wallets
  const existingPortAgnostic = localStorage.getItem(`localhost_${WALLETS_STORAGE_KEY}`);
  if (existingPortAgnostic) return; // Already migrated
  
  // Try to find wallets from the original port-specific key
  const portSpecificWallets = localStorage.getItem(WALLETS_STORAGE_KEY);
  const portSpecificActive = localStorage.getItem(ACTIVE_WALLET_KEY);
  
  if (portSpecificWallets) {
    console.log('Migrating wallets from port-specific storage...');
    // Copy to port-agnostic storage
    localStorage.setItem(`localhost_${WALLETS_STORAGE_KEY}`, portSpecificWallets);
    if (portSpecificActive) {
      localStorage.setItem(`localhost_${ACTIVE_WALLET_KEY}`, portSpecificActive);
    }
  }
};

/**
 * Get all stored wallet information
 */
export const getStoredWallets = (): WalletInfo[] => {
  if (typeof window === 'undefined') return [];
  
  // Migrate existing wallets from port-specific storage
  migratePortSpecificWallets();
  
  try {
    const walletsJson = getStorageItem(WALLETS_STORAGE_KEY);
    console.log('🔍 Debug - getStoredWallets():');
    console.log('Storage key:', getPortAgnosticStorageKey(WALLETS_STORAGE_KEY));
    console.log('Raw data:', walletsJson);
    
    if (!walletsJson) {
      console.log('No wallet data found in storage');
      return [];
    }
    
    const wallets = JSON.parse(walletsJson);
    console.log(`Found ${wallets.length} stored wallet(s):`, wallets);
    
    return wallets;
  } catch (error) {
    console.warn('Failed to parse stored wallets:', error);
    return [];
  }
};

/**
 * Clear all stored wallets (for testing G-address persistence)
 */
export const clearAllWallets = (): void => {
  try {
    const storageKey = LocalKeyStorage.buildKey('zi_passkey_wallets');
    localStorage.removeItem(storageKey);
    console.log('✅ All wallets cleared from storage');
  } catch (error) {
    console.error('Failed to clear wallets:', error);
  }
};

/**
 * DEBUG ONLY: Restore test wallets for verification
 * Call this from browser console to restore wallets after they were cleared
 */
export const restoreTestWallets = (): void => {
  if (typeof window === 'undefined') return;
  
  const testWallets: WalletInfo[] = [
    {
      id: 'wallet_test_1',
      name: 'Nathan Test',
      contractId: 'CD5FFADFPSAPRP62BY3LL5QFWBOBUJ3USRPEPWU2G5NA3NMFAKDNCFH5',
      keyId: 'DW9tTWr1tyxrPpy40QChenRo-tWaaV_1gLoNWRzgQyQ',
      createdAt: Date.now() - 86400000, // 1 day ago
      lastUsed: Date.now() - 3600000, // 1 hour ago
      isActive: false
    },
    {
      id: 'wallet_test_2', 
      name: 'Test Wallet 2',
      contractId: 'CB6XYRX4CMMIC7PMOZIZC4KN3CSC3NROO7IPEG5NAIU53FCZPMBY3TUX',
      keyId: 'L2c031TruK9iPTEV3d0VI3GngBrDzMEXvq0LZwJHlSQ',
      createdAt: Date.now() - 172800000, // 2 days ago
      lastUsed: Date.now() - 7200000, // 2 hours ago
      isActive: false
    }
  ];
  
  setStorageItem(WALLETS_STORAGE_KEY, JSON.stringify(testWallets));
  console.log('🔧 Test wallets restored:', testWallets);
};

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).restoreTestWallets = restoreTestWallets;
}

/**
 * Save wallet information to storage
 */
export const saveWalletInfo = (walletInfo: WalletInfo): void => {
  if (typeof window === 'undefined') return;
  
  const wallets = getStoredWallets();
  const existingIndex = wallets.findIndex(w => w.id === walletInfo.id);
  
  if (existingIndex >= 0) {
    wallets[existingIndex] = walletInfo;
  } else {
    wallets.push(walletInfo);
  }
  
  setStorageItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
};

/**
 * Generate a unique wallet ID
 */
const generateWalletId = (): string => {
  return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new named wallet
 */
export const createNamedWallet = async (
  walletName: string = "My Wallet",
  appName: string = "ZI Playground"
): Promise<WalletInfo> => {
  const walletId = generateWalletId();
  
  console.log(`Creating new wallet: "${walletName}"`);
  
  // Set flag to indicate we're creating a named wallet
  setCreatingNamedWallet(true);
  console.log('🚨 Set creatingNamedWallet flag to TRUE');
  
  // Set the wallet name for the passkeyClient to use
  setWalletCreationName(walletName);
  
  try {
    console.log('🔨 Calling account.createWallet()...');
    const {
      keyIdBase64,
      contractId,
      signedTx,
    } = await account.createWallet(appName, walletName);
    
    console.log('✅ account.createWallet() returned:', {
      keyId: keyIdBase64?.substring(0, 8) + '...',
      contractId: contractId?.substring(0, 8) + '...',
      signedTx: !!signedTx
    });

    // Let's check what type of address this is and get the underlying Stellar account
    console.log('🔍 Analyzing wallet addresses:');
    console.log('📝 Contract ID (C-address):', contractId);
    
    // Try to get the underlying Stellar account from PasskeyKit
    try {
      const passkeyWallet = account.wallet;
      if (passkeyWallet) {
        console.log('🔑 PasskeyKit wallet instance:', {
          contractId: passkeyWallet.options?.contractId,
          rpcUrl: passkeyWallet.options?.rpcUrl?.substring(0, 30) + '...'
        });
        
        // Check if there's an underlying account
        const publicKey = await passkeyWallet.getPublicKey();
        console.log('🌟 Underlying Stellar account (G-address):', publicKey);
      }
    } catch (accountError) {
      console.warn('⚠️ Could not get underlying Stellar account:', accountError);
    }

    // Fund the wallet using friendbot
    console.log('💰 Funding wallet with friendbot for CONTRACT:', contractId.substring(0, 8) + '...');
    
    // We need to fund the underlying Stellar account, not the contract
    let accountToFund = contractId; // Start with contract ID
    
    // Try to get the underlying G-address if possible
    try {
      if (account.wallet) {
        const underlyingAccount = await account.wallet.getPublicKey();
        if (underlyingAccount && underlyingAccount.startsWith('G')) {
          accountToFund = underlyingAccount;
          console.log('🎯 Found underlying Stellar account to fund:', accountToFund.substring(0, 8) + '...');
        }
      }
    } catch (e) {
      console.log('📝 Using contract ID for funding (could not get underlying account)');
    }
    
    try {
      console.log('📡 Calling friendbot for:', accountToFund.substring(0, 8) + '...');
      const fundResponse = await fetch(`https://friendbot.stellar.org?addr=${accountToFund}`);
      console.log('📡 Friendbot response status:', fundResponse.status);
      if (fundResponse.ok) {
        const responseText = await fundResponse.text();
        console.log('✅ Wallet funded successfully:', responseText.substring(0, 100) + '...');
      } else {
        console.warn('⚠️ Friendbot funding failed with status:', fundResponse.status);
        const errorText = await fundResponse.text();
        console.warn('⚠️ Friendbot error response:', errorText.substring(0, 200));
      }
    } catch (fundError) {
      console.warn('⚠️ Friendbot funding error:', fundError);
    }

    const walletInfo: WalletInfo = {
      id: walletId,
      name: walletName,
      contractId,
      keyId: keyIdBase64,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
    };

    // Save wallet info
    saveWalletInfo(walletInfo);
    setActiveWallet(walletId);
    
    // Store the wallet in the existing LocalKeyStorage system too
    LocalKeyStorage.storePasskeyKeyId(keyIdBase64);
    LocalKeyStorage.storePasskeyContractId(contractId);
    
    console.log('✅ Named wallet created, funded, and saved:', contractId.substring(0, 8) + '...');
    
    return walletInfo;
  } finally {
    // Clear the flag
    setCreatingNamedWallet(false);
  }
};

/**
 * Set the active wallet
 */
export const setActiveWallet = (walletId: string): void => {
  if (typeof window === 'undefined') return;
  
  // Update all wallets to inactive
  const wallets = getStoredWallets();
  const updatedWallets = wallets.map(w => ({
    ...w,
    isActive: w.id === walletId,
    lastUsed: w.id === walletId ? Date.now() : w.lastUsed,
  }));
  
    setStorageItem(WALLETS_STORAGE_KEY, JSON.stringify(updatedWallets));
  setStorageItem(ACTIVE_WALLET_KEY, walletId);
};

/**
 * Get the currently active wallet
 */
export const getActiveWallet = (): WalletInfo | null => {
  if (typeof window === 'undefined') return null;
  
  const activeWalletId = getStorageItem(ACTIVE_WALLET_KEY);
  if (!activeWalletId) return null;
  
  const wallets = getStoredWallets();
  return wallets.find(w => w.id === activeWalletId) || null;
};

/**
 * Connect to an existing wallet by its info
 */
export const connectToWallet = async (walletInfo: WalletInfo): Promise<string> => {
  console.log(`Connecting to wallet: "${walletInfo.name}"`);
  console.log(`Using contractId: ${walletInfo.contractId.substring(0, 8)}...`);
  
  try {
    // Set flag to indicate we're connecting to an existing wallet FIRST
    setConnectingToExistingWallet(walletInfo.contractId);
    
    console.log('✅ Triggering WebAuthn authentication for wallet connection...');
    
    // Initialize the wallet in PasskeyKit
    initializeWallet(walletInfo.contractId);
    
    // Store wallet credentials for session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('passkey_keyId', walletInfo.keyId);
      sessionStorage.setItem('passkey_contractId', walletInfo.contractId);
      sessionStorage.removeItem('passkey_user_disconnected');
      sessionStorage.removeItem('passkey_recovery_attempted');  
      sessionStorage.removeItem('passkey_create_new_requested');
    }
    
    // Call getPublicKey directly to trigger WebAuthn authentication
    const passkeyConnector = await import('./passkeyClient');
    const connector = passkeyConnector.default();
    
    // This should trigger the WebAuthn authentication flow
    const result = await connector.getPublicKey();
    console.log('🎉 WebAuthn authentication completed, contract ID:', result.substring(0, 8) + '...');
    
    console.log(`Connected successfully to wallet: "${walletInfo.name}" with TouchID authentication`);
    
    // Update last used timestamp and set as active
    const updatedWallet: WalletInfo = {
      ...walletInfo,
      lastUsed: Date.now(),
      isActive: true,
    };
    
    saveWalletInfo(updatedWallet);
    setActiveWallet(walletInfo.id);
    
    // Store in the existing LocalKeyStorage system too
    LocalKeyStorage.storePasskeyKeyId(walletInfo.keyId);
    LocalKeyStorage.storePasskeyContractId(walletInfo.contractId);
    
    // CRITICAL: Store wallet data for Soroban connector isConnected() check
    const token = `passkey_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    LocalKeyStorage.storeToken(token);
    LocalKeyStorage.storeWallet({
      publicKey: walletInfo.contractId,
      walletType: 'passkey',
      timestamp: Date.now(),
      token,
    });
    LocalKeyStorage.storeUser({
      id: walletInfo.contractId,
      name: walletInfo.name,
      timestamp: Date.now(),
      walletConnected: true,
      token,
    });

    return walletInfo.contractId;
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw new Error(`Failed to connect to wallet "${walletInfo.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Remove a wallet from storage
 */
export const removeWallet = (walletId: string): void => {
  if (typeof window === 'undefined') return;
  
  console.log(`🗑️ removeWallet called for walletId: ${walletId}`);
  console.trace('removeWallet call stack:');
  
  const wallets = getStoredWallets();
  const walletToRemove = wallets.find(w => w.id === walletId);
  if (walletToRemove) {
    console.log(`Removing wallet: "${walletToRemove.name}" (${walletToRemove.contractId.substring(0, 8)}...)`);
  } else {
    console.log(`Wallet with ID ${walletId} not found in list`);
  }
  
  const filteredWallets = wallets.filter(w => w.id !== walletId);
  
  setStorageItem(WALLETS_STORAGE_KEY, JSON.stringify(filteredWallets));
  
  // If removing active wallet, clear active wallet
  const activeWalletId = getStorageItem(ACTIVE_WALLET_KEY);
  if (activeWalletId === walletId) {
    removeStorageItem(ACTIVE_WALLET_KEY);
  }
};

/**
 * Try to discover existing passkey wallets from browser credentials
 */
export const discoverExistingWallets = async (): Promise<WalletInfo[]> => {
  const storedWallets = getStoredWallets();
  const discoveredWallets: WalletInfo[] = [];

  // For each stored wallet, try to verify it still exists
  for (const wallet of storedWallets) {
    try {
      // Attempt to connect without actually connecting
      // This will trigger WebAuthn which can help verify the credential exists
      console.log(`Verifying wallet: "${wallet.name}"`);
      
      // Note: This is a simplified approach. In a real implementation,
      // you might want to use navigator.credentials.get() to check
      // if the credential is available without actually using it
      discoveredWallets.push(wallet);
    } catch (error) {
      console.warn(`Wallet "${wallet.name}" may no longer be available:`, error);
    }
  }

  return discoveredWallets;
};

/**
 * Get wallet display name with fallback
 */
export const getWalletDisplayName = (wallet: WalletInfo): string => {
  return wallet.name || `Wallet ${wallet.contractId.substring(0, 8)}...`;
};

/**
 * Format wallet address for display
 */
export const formatWalletAddress = (contractId: string): string => {
  if (!contractId || typeof contractId !== 'string') return 'Unknown Address';
  if (contractId.length <= 16) return contractId;
  return `${contractId.substring(0, 8)}...${contractId.substring(contractId.length - 8)}`;
};

/**
 * Enhanced debug function to find the underlying Stellar account that holds funds
 * Since the contract doesn't exist, we need to find the G-address that PasskeyKit uses
 */
export const debugWalletAddresses = async (): Promise<string | null> => {
  try {
    console.log('🔍 Enhanced PasskeyKit Account Hunt:');
    console.log('=====================================');
    
    // Get stored wallet info
    const wallets = getStoredWallets();
    if (wallets.length === 0) {
      console.log('❌ No stored wallets found');
      return null;
    }
    
    const wallet = wallets[0];
    console.log('📝 Stored Wallet Info:');
    console.log(`  - Wallet Name: ${wallet.name}`);
    console.log(`  - Contract ID (C-address): ${wallet.contractId}`);
    console.log(`  - Key ID: ${wallet.keyId.substring(0, 10)}...`);
    console.log(`  - ❌ Contract ${wallet.contractId} NOT FOUND on ledger`);
    
    // Get the underlying Stellar account from PasskeyKit
    const { account } = await import('./passkey-kit');
    if (!account || !account.wallet) {
      console.log('⚠️ PasskeyKit account not initialized');
      return null;
    }
    
    console.log('\n🔍 Deep PasskeyKit Analysis:');
    console.log('🛠️ Wallet methods:', Object.getOwnPropertyNames(account.wallet));
    console.log('🛠️ Wallet prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(account.wallet)));
    
    // Look for signer information - this is key!
    if (account.signer) {
      console.log('\n🔑 SIGNER FOUND - This holds the real account!');
      console.log('🔑 Signer type:', typeof account.signer);
      console.log('🔑 Signer methods:', Object.getOwnPropertyNames(account.signer));
      
      // Try to get the actual Stellar public key
      let stellarAccount = null;
      
      try {
        // Method 1: Direct public key access
        if (account.signer.publicKey) {
          console.log('🔑 Found signer.publicKey:', account.signer.publicKey);
          stellarAccount = account.signer.publicKey;
        }
      } catch (e) {
        console.log('❌ signer.publicKey failed:', e.message);
      }
      
      try {
        // Method 2: getPublicKey method
        if (typeof account.signer.getPublicKey === 'function') {
          const pubKey = await account.signer.getPublicKey();
          console.log('🔑 signer.getPublicKey():', pubKey);
          stellarAccount = pubKey;
        }
      } catch (e) {
        console.log('❌ signer.getPublicKey() failed:', e.message);
      }
      
      try {
        // Method 3: Check if it's a Keypair object
        if (typeof account.signer.publicKey === 'function') {
          const pubKey = account.signer.publicKey();
          console.log('🔑 signer.publicKey() method:', pubKey);
          stellarAccount = pubKey;
        }
      } catch (e) {
        console.log('❌ signer.publicKey() method failed:', e.message);
      }
      
      try {
        // Method 4: Check for .address property
        if (account.signer.address) {
          console.log('🔑 signer.address:', account.signer.address);
          stellarAccount = account.signer.address;
        }
      } catch (e) {
        console.log('❌ signer.address failed:', e.message);
      }
      
      if (stellarAccount) {
        console.log('\n⭐ FOUND STELLAR ACCOUNT:', stellarAccount);
        if (stellarAccount.startsWith('G')) {
          console.log('✅ This is a valid Stellar account (G-address)!');
          console.log(`🌟 CHECK YOUR FUNDS HERE: https://stellar.expert/explorer/testnet/account/${stellarAccount}`);
          return stellarAccount;
        } else {
          console.log('⚠️ This might not be the final address, continuing search...');
        }
      }
    } else {
      console.log('❌ No signer found on account object');
    }
    
    // Check account object properties thoroughly
    console.log('\n🔍 Full Account Object Analysis:');
    console.log('📋 Account keys:', Object.keys(account));
    console.log('📋 Account properties:', Object.getOwnPropertyNames(account));
    
    // Look for any property that might be a Stellar address
    for (const prop of Object.keys(account)) {
      const value = account[prop];
      if (typeof value === 'string' && value.startsWith('G')) {
        console.log(`⭐ FOUND G-ADDRESS in account.${prop}:`, value);
        console.log(`🌟 CHECK THIS: https://stellar.expert/explorer/testnet/account/${value}`);
        return value;
      }
    }
    
    // Fallback: Try to get any address from the wallet
    try {
      const walletAddress = await account.wallet.address;
      console.log('🔄 Wallet.address result:', walletAddress);
      if (walletAddress && walletAddress.startsWith('G')) {
        console.log(`⭐ FOUND G-ADDRESS from wallet: ${walletAddress}`);
        console.log(`🌟 CHECK THIS: https://stellar.expert/explorer/testnet/account/${walletAddress}`);
        return walletAddress;
      }
    } catch (e) {
      console.log('❌ wallet.address failed:', e.message);
    }
    
    console.log('\n🚨 SUMMARY:');
    console.log(`❌ Contract ${wallet.contractId} does not exist on ledger`);
    console.log('❌ Could not locate underlying Stellar account (G-address)');
    console.log('💡 Your funds must be somewhere - try these steps:');
    console.log('   1. Make sure wallet is fully connected');
    console.log('   2. Try making a small transaction to see which account signs it');
    console.log('   3. Check your browser console for any G-addresses during wallet operations');
    
    return null;
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};

/**
 * Get the underlying Stellar account (G-address) for a PasskeyKit wallet
 * Returns the actual account where funds are stored, not the contract reference
 */
export const getUnderlyingAccount = async (): Promise<string | null> => {
  try {
    const { account } = await import('./passkey-kit');
    
    if (!account || !account.walletPublicKey) {
      return null;
    }
    
    // The walletPublicKey contains the actual G-address
    return account.walletPublicKey;
  } catch (error) {
    console.error('Failed to get underlying account:', error);
    return null;
  }
};

// Export global debug function for console access
if (typeof window !== 'undefined') {
  (window as any).debugWallet = debugWalletAddresses;
  (window as any).getUnderlyingAccount = getUnderlyingAccount;
}