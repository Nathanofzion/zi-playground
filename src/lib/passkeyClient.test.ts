import passkey from './passkeyClient';
import { LocalKeyStorage } from './localKeyStorage';
import { handleLogin, handleRegister, handleSign } from './passkey';
import { activeChain } from './chain';

// src/lib/passkeyClient.test.ts

// Mock dependencies
jest.mock('./localKeyStorage');
jest.mock('./passkey');
jest.mock('./chain');

describe('PasskeyClient', () => {
  let passkeyInstance: ReturnType<typeof passkey>;
  let mockLocalKeyStorage: jest.Mocked<typeof LocalKeyStorage>;
  let mockHandleLogin: jest.MockedFunction<typeof handleLogin>;
  let mockHandleRegister: jest.MockedFunction<typeof handleRegister>;
  let mockHandleSign: jest.MockedFunction<typeof handleSign>;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Setup mocked dependencies
    mockLocalKeyStorage = LocalKeyStorage as jest.Mocked<typeof LocalKeyStorage>;
    mockHandleLogin = handleLogin as jest.MockedFunction<typeof handleLogin>;
    mockHandleRegister = handleRegister as jest.MockedFunction<typeof handleRegister>;
    mockHandleSign = handleSign as jest.MockedFunction<typeof handleSign>;
    
    // Create fresh instance for each test
    passkeyInstance = passkey();
    
    // Mock activeChain
    (activeChain as any) = { id: 'testnet', name: 'Test Network' };
  });

  describe('Wallet Configuration', () => {
    test('should have correct wallet configuration', () => {
      expect(passkeyInstance.id).toBe('passkey');
      expect(passkeyInstance.name).toBe('PasskeyID');
      expect(passkeyInstance.shortName).toBe('Passkey');
      expect(passkeyInstance.iconUrl).toBe('/images/passkey.png');
      expect(passkeyInstance.iconBackground).toBe('#4f46e5');
      expect(passkeyInstance.installed).toBe(true);
      expect(passkeyInstance.downloadUrls).toEqual({});
    });
  });

  describe('Connection Status', () => {
    test('should return true when connected with valid token and passkey wallet', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockLocalKeyStorage.getWallet.mockReturnValue({
        publicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        walletType: 'passkey',
        timestamp: Date.now(),
        token: 'valid-token'
      });

      const isConnected = await passkeyInstance.isConnected();
      expect(isConnected).toBe(true);
    });

    test('should return false when no token exists', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      const isConnected = await passkeyInstance.isConnected();
      expect(isConnected).toBe(false);
    });

    test('should return false when wallet type is not passkey', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockLocalKeyStorage.getWallet.mockReturnValue({
        publicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        walletType: 'freighter',
        timestamp: Date.now(),
        token: 'valid-token'
      });

      const isConnected = await passkeyInstance.isConnected();
      expect(isConnected).toBe(false);
    });

    test('hasValidSession should return correct status', () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockLocalKeyStorage.getWallet.mockReturnValue({
        publicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        walletType: 'passkey',
        timestamp: Date.now(),
        token: 'valid-token'
      });

      const hasValidSession = passkeyInstance.hasValidSession();
      expect(hasValidSession).toBe(true);
    });
  });

  describe('Network Details', () => {
    test('should return active chain details', async () => {
      const networkDetails = await passkeyInstance.getNetworkDetails();
      expect(networkDetails).toEqual({ id: 'testnet', name: 'Test Network' });
    });
  });

  describe('Public Key Retrieval', () => {
    test('should return existing valid public key when already connected', async () => {
      const validPublicKey = 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK';
      
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockLocalKeyStorage.getWallet.mockReturnValue({
        publicKey: validPublicKey,
        walletType: 'passkey',
        timestamp: Date.now(),
        token: 'valid-token'
      });

      const publicKey = await passkeyInstance.getPublicKey();
      expect(publicKey).toBe(validPublicKey);
      expect(mockHandleLogin).not.toHaveBeenCalled();
      expect(mockHandleRegister).not.toHaveBeenCalled();
    });

    test('should clear mock data and generate new account when existing key contains X characters', async () => {
      const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      const validPublicKey = 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK';
      
      // First call returns mock data
      mockLocalKeyStorage.getToken.mockReturnValue('mock-token');
      mockLocalKeyStorage.getWallet.mockReturnValue({
        publicKey: mockPublicKey,
        walletType: 'passkey',
        timestamp: Date.now(),
        token: 'mock-token'
      });

      // Mock successful login
      mockHandleLogin.mockResolvedValue({
        token: 'new-token',
        publicKey: validPublicKey
      });

      const publicKey = await passkeyInstance.getPublicKey();
      
      expect(mockLocalKeyStorage.clearAll).toHaveBeenCalled();
      expect(publicKey).toBe(validPublicKey);
      expect(mockLocalKeyStorage.storeToken).toHaveBeenCalledWith('new-token');
      expect(mockLocalKeyStorage.storeWallet).toHaveBeenCalledWith({
        publicKey: validPublicKey,
        walletType: 'passkey',
        timestamp: expect.any(Number),
        token: 'new-token'
      });
    });

    test('should attempt login first, then register if login fails', async () => {
      const validPublicKey = 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK';
      
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      // Mock login failure, then successful registration
      mockHandleLogin.mockRejectedValue(new Error('No existing passkey'));
      mockHandleRegister.mockResolvedValue({
        token: 'new-token',
        publicKey: validPublicKey
      });

      const publicKey = await passkeyInstance.getPublicKey();
      
      expect(mockHandleLogin).toHaveBeenCalled();
      expect(mockHandleRegister).toHaveBeenCalled();
      expect(publicKey).toBe(validPublicKey);
    });

    test('should validate public key format and reject invalid keys', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      // Test invalid public key (not starting with G)
      mockHandleLogin.mockResolvedValue({
        token: 'token',
        publicKey: 'ABTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK'
      });

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'Invalid public key: does not start with G'
      );
    });

    test('should validate public key length', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      // Test invalid public key (wrong length)
      mockHandleLogin.mockResolvedValue({
        token: 'token',
        publicKey: 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQ' // Too short
      });

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'Invalid public key: wrong length (41, should be 56)'
      );
    });

    test('should reject mock data public keys', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      mockHandleLogin.mockResolvedValue({
        token: 'token',
        publicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      });

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'Invalid public key: still using mock data'
      );
    });

    test('should clean up on authentication failure', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);

      mockHandleLogin.mockRejectedValue(new Error('Auth failed'));
      mockHandleRegister.mockRejectedValue(new Error('Registration failed'));

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow();
      expect(mockLocalKeyStorage.clearAll).toHaveBeenCalled();
    });
  });

  describe('Transaction Signing', () => {
    const mockXdr = 'AAAAAgAAAABhsW9M8...'; // Mock XDR string
    const mockSignedXdr = 'AAAAAgAAAABhsW9M8SIGNED...';

    test('should successfully sign transaction with valid session', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockHandleSign.mockResolvedValue(mockSignedXdr);

      const result = await passkeyInstance.signTransaction(mockXdr);
      
      expect(mockHandleSign).toHaveBeenCalledWith(mockXdr, undefined);
      expect(result).toBe(mockSignedXdr);
    });

    test('should sign transaction with options', async () => {
      const options = {
        network: 'testnet',
        networkPassphrase: 'Test SDF Network ; September 2015',
        accountToSign: 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK'
      };

      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockHandleSign.mockResolvedValue(mockSignedXdr);

      const result = await passkeyInstance.signTransaction(mockXdr, options);
      
      expect(mockHandleSign).toHaveBeenCalledWith(mockXdr, options);
      expect(result).toBe(mockSignedXdr);
    });

    test('should throw error when no session exists', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);

      await expect(passkeyInstance.signTransaction(mockXdr)).rejects.toThrow(
        'No PasskeyID session found. Please reconnect your wallet.'
      );
    });

    test('should throw error when signing fails', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockHandleSign.mockRejectedValue(new Error('Signing failed'));

      await expect(passkeyInstance.signTransaction(mockXdr)).rejects.toThrow(
        'Signing failed'
      );
    });

    test('should throw error when no result is returned from signing', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue('valid-token');
      mockHandleSign.mockResolvedValue(null as any);

      await expect(passkeyInstance.signTransaction(mockXdr)).rejects.toThrow(
        'Failed to sign transaction - no result returned'
      );
    });
  });

  describe('Wallet Management', () => {
    test('should return wallet info from LocalKeyStorage', () => {
      const mockWallet = {
        publicKey: 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK',
        walletType: 'passkey' as const,
        timestamp: Date.now(),
        token: 'token'
      };

      mockLocalKeyStorage.getWallet.mockReturnValue(mockWallet);

      const walletInfo = passkeyInstance.getWalletInfo();
      expect(walletInfo).toEqual(mockWallet);
    });

    test('should return connection status from LocalKeyStorage', () => {
      const mockStatus = { connected: true, timestamp: Date.now() };
      mockLocalKeyStorage.getConnectionStatus.mockReturnValue(mockStatus);

      const status = passkeyInstance.getConnectionStatus();
      expect(status).toEqual(mockStatus);
    });

    test('should disconnect and clear all data', () => {
      passkeyInstance.disconnect();
      expect(mockLocalKeyStorage.clearAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing result from authentication', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockResolvedValue(null as any);

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'PasskeyID authentication returned no result. Please try again.'
      );
    });

    test('should handle missing token from authentication', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockResolvedValue({ token: null, publicKey: 'GXXX...' } as any);

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'PasskeyID authentication returned no token. Please try again.'
      );
    });

    test('should handle missing public key from authentication', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockResolvedValue({ token: 'token', publicKey: null } as any);

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'PasskeyID authentication returned no public key. Please try again.'
      );
    });

    test('should provide user-friendly error messages', async () => {
      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockRejectedValue(new Error('Network error'));
      mockHandleRegister.mockRejectedValue(new Error('Network error'));

      await expect(passkeyInstance.getPublicKey()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Local Storage Integration', () => {
    test('should store token in multiple storage locations', async () => {
      const validPublicKey = 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK';
      const token = 'test-token';

      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockResolvedValue({ token, publicKey: validPublicKey });

      await passkeyInstance.getPublicKey();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mock_passkey_token', token);
      expect(mockLocalKeyStorage.storeToken).toHaveBeenCalledWith(token);
    });

    test('should store user data with correct structure', async () => {
      const validPublicKey = 'GBTLKNGQVOWGNG7QXDL4Y6JQI3LYVQT5XFMZGBRQOPMHXZ4M6MRGDSPK';
      const token = 'test-token';

      mockLocalKeyStorage.getToken.mockReturnValue(null);
      mockLocalKeyStorage.getWallet.mockReturnValue(null);
      mockHandleLogin.mockResolvedValue({ token, publicKey: validPublicKey });

      await passkeyInstance.getPublicKey();

      expect(mockLocalKeyStorage.storeUser).toHaveBeenCalledWith({
        id: validPublicKey,
        name: 'PasskeyID User',
        timestamp: expect.any(Number),
        walletConnected: true,
        token
      });
    });
  });
});