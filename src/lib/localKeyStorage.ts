export interface UserData {
  id: string;
  name: string;
  timestamp: number;
  walletConnected: boolean;
  token?: string;
}

export interface WalletData {
  publicKey: string;
  walletType: 'passkey' | 'freighter' | 'lobstr' | string;
  timestamp: number;
  token?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  walletType?: string;
  publicKey?: string;
  timestamp?: number;
}

export class LocalKeyStorage {
  private static readonly USER_KEY = 'zi_user_data';
  private static readonly WALLET_KEY = 'zi_wallet_data';
  private static readonly TOKEN_KEY = 'zi_auth_token';

  // User data methods
  static storeUser(userData: UserData): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      console.log('👤 User data stored locally');
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  static getUser(): UserData | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Wallet data methods
  static storeWallet(walletData: WalletData): void {
    try {
      localStorage.setItem(this.WALLET_KEY, JSON.stringify(walletData));
      console.log('💳 Wallet data stored locally');
    } catch (error) {
      console.error('Failed to store wallet data:', error);
    }
  }

  static getWallet(): WalletData | null {
    try {
      const data = localStorage.getItem(this.WALLET_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get wallet data:', error);
      return null;
    }
  }

  // Token methods
  static storeToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('🔑 Token stored locally');
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // Connection status
  static getConnectionStatus(): ConnectionStatus {
    const wallet = this.getWallet();
    const token = this.getToken();
    
    return {
      isConnected: !!(wallet && token),
      walletType: wallet?.walletType,
      publicKey: wallet?.publicKey,
      timestamp: wallet?.timestamp
    };
  }

  // Store passkey data for a specific credential ID
  static storePasskeyData(credentialId: string, data: any): void {
    try {
      const key = `passkey_${credentialId}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Passkey data stored for credential:', credentialId.substring(0, 8) + '...');
    } catch (error) {
      console.error('Failed to store passkey data:', error);
    }
  }

  // Get passkey data for a specific credential ID
  static getPasskeyData(credentialId: string): any | null {
    try {
      const key = `passkey_${credentialId}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to get passkey data:', error);
      return null;
    }
  }

  // Get all stored passkey data
  static getAllPasskeyData(): { [credentialId: string]: any } {
    const passkeys: { [credentialId: string]: any } = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('passkey_')) {
          const credentialId = key.replace('passkey_', '');
          const data = localStorage.getItem(key);
          if (data) {
            passkeys[credentialId] = JSON.parse(data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all passkey data:', error);
    }
    
    return passkeys;
  }

  // Clear all passkey data
  static clearPasskeyData(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('passkey_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ All passkey data cleared');
    } catch (error) {
      console.error('Failed to clear passkey data:', error);
    }
  }

  // Passkey-specific storage keys
  private static readonly PASSKEY_KEYID_KEY = 'zi_passkey_keyId';
  private static readonly PASSKEY_CONTRACT_ID_KEY = 'zi_passkey_contractId';
  private static readonly PASSKEY_STATUS_KEY = 'zi_passkey_status';

  // Passkey storage methods
  static storePasskeyKeyId(keyId: string): void {
    try {
      localStorage.setItem(this.PASSKEY_KEYID_KEY, keyId);
      console.log('🔑 Passkey keyId stored');
    } catch (error) {
      console.error('Failed to store passkey keyId:', error);
    }
  }

  static getPasskeyKeyId(): string | null {
    try {
      return localStorage.getItem(this.PASSKEY_KEYID_KEY);
    } catch (error) {
      console.error('Failed to get passkey keyId:', error);
      return null;
    }
  }

  static storePasskeyContractId(contractId: string): void {
    try {
      localStorage.setItem(this.PASSKEY_CONTRACT_ID_KEY, contractId);
      console.log('📝 Passkey contractId stored');
    } catch (error) {
      console.error('Failed to store passkey contractId:', error);
    }
  }

  static getPasskeyContractId(): string | null {
    try {
      return localStorage.getItem(this.PASSKEY_CONTRACT_ID_KEY);
    } catch (error) {
      console.error('Failed to get passkey contractId:', error);
      return null;
    }
  }

  private static emitPasskeyStatus(status: string | null): void {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
      return;
    }
    window.dispatchEvent(new CustomEvent('passkey-status', { detail: status }));
  }

  static storePasskeyStatus(status: string): void {
    try {
      localStorage.setItem(this.PASSKEY_STATUS_KEY, status);
      this.emitPasskeyStatus(status);
    } catch (error) {
      console.error('Failed to store passkey status:', error);
    }
  }

  static getPasskeyStatus(): string | null {
    try {
      return localStorage.getItem(this.PASSKEY_STATUS_KEY);
    } catch (error) {
      console.error('Failed to get passkey status:', error);
      return null;
    }
  }

  static clearPasskeyStatus(): void {
    try {
      localStorage.removeItem(this.PASSKEY_STATUS_KEY);
      this.emitPasskeyStatus(null);
    } catch (error) {
      console.error('Failed to clear passkey status:', error);
    }
  }

  static getWalletType(): 'passkey' | 'freighter' | 'lobstr' | null {
    try {
      const wallet = this.getWallet();
      return (wallet?.walletType as 'passkey' | 'freighter' | 'lobstr') || null;
    } catch (error) {
      console.error('Failed to get wallet type:', error);
      return null;
    }
  }

  // Clear all data
  static clearAll(): void {
    try {
      // Clear existing data
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.WALLET_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem("token"); // Also clear the direct token
      localStorage.removeItem("mock_passkey_token"); // Clear mock token
      
      // Clear passkey-specific data
      localStorage.removeItem(this.PASSKEY_KEYID_KEY);
      localStorage.removeItem(this.PASSKEY_CONTRACT_ID_KEY);
      this.clearPasskeyStatus();
      
      // Clear all passkey data
      this.clearPasskeyData();
      
      console.log('🗑️ All local data cleared');
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }
}
