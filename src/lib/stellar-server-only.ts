import https from 'https';

let StellarSDK: any = null;
let initialized = false;

async function initializeStellarSDK() {
  if (initialized) return StellarSDK;
  
  if (typeof window !== 'undefined') {
    throw new Error('Stellar SDK should not be used client-side');
  }

  try {
    StellarSDK = await import('@stellar/stellar-sdk');
    initialized = true;
    console.log('✅ Stellar SDK initialized server-side');
    return StellarSDK;
  } catch (error) {
    console.error('❌ Failed to initialize Stellar SDK:', error);
    throw error;
  }
}

export class ServerStellarService {
  private server: any = null;
  private sorobanServer: any = null;
  private sdk: any = null;
  private httpsAgent: https.Agent;

  constructor() {
    // Create HTTPS agent that ignores SSL certificate validation
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false, // This disables SSL certificate validation
      keepAlive: true,
      timeout: 30000,
      maxSockets: 50,
    });
  }

  async initialize() {
    if (this.sdk) return;
    
    this.sdk = await initializeStellarSDK();
    
    // Configure Horizon server with custom HTTPS agent
    this.server = new this.sdk.Horizon.Server('https://horizon-testnet.stellar.org', {
      allowHttp: false,
      timeout: 30000,
      headers: {
        'X-Client-Name': 'zi-playground',
        'X-Client-Version': '1.0.0',
        'User-Agent': 'zi-playground/1.0.0',
      },
      agent: this.httpsAgent,
    });

    // Configure Soroban RPC server with custom HTTPS agent
    this.sorobanServer = new this.sdk.SorobanRpc.Server(
      'https://soroban-testnet.stellar.org',
      {
        allowHttp: false,
        timeout: 30000,
        headers: {
          'X-Client-Name': 'zi-playground',
          'X-Client-Version': '1.0.0',
          'User-Agent': 'zi-playground/1.0.0',
        },
        agent: this.httpsAgent,
      }
    );
    
    console.log('✅ Stellar servers initialized with SSL configuration');
  }

  async validatePublicKey(publicKey: string): Promise<boolean> {
    await this.initialize();
    try {
      this.sdk.Keypair.fromPublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  async fundAccountViaFriendbot(publicKey: string) {
    // Use Node.js https module directly instead of fetch
    const https = await import('https');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'friendbot.stellar.org',
        path: `/?addr=${publicKey}`,
        method: 'GET',
        rejectUnauthorized: false, // Ignore SSL certificate validation
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Friendbot failed with status ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse friendbot response: ${error}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Friendbot request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Friendbot request timed out'));
      });

      req.end();
    });
  }

  async getAccount(publicKey: string) {
    await this.initialize();
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async parseXdr(base64Xdr: string) {
    await this.initialize();
    return this.sdk.xdr.ScVal.fromXDR(Buffer.from(base64Xdr, "base64"));
  }

  async nativeToScVal(value: any) {
    await this.initialize();
    return this.sdk.nativeToScVal(value);
  }

  async scValToNative(scVal: any) {
    await this.initialize();
    return this.sdk.scValToNative(scVal);
  }

  // ✅ NEW METHODS - Add these to support the API route
  async nativeToScValU32(value: number) {
    await this.initialize();
    return this.sdk.xdr.ScVal.scvU32(value);
  }

  async nativeToScValI128(value: number | string | bigint) {
    await this.initialize();
    
    // Convert to BigInt to handle large numbers properly
    let bigIntValue: bigint;
    if (typeof value === 'string') {
      bigIntValue = BigInt(value);
    } else if (typeof value === 'bigint') {
      bigIntValue = value;
    } else {
      // For numbers, convert to string first to avoid precision loss, then to BigInt
      bigIntValue = BigInt(Math.floor(value).toString());
    }
    
    // Construct i128 ScVal directly (SDK's nativeToScVal with type option has issues)
    // Split BigInt into high and low 64-bit parts
    const mask64 = 0xFFFFFFFFFFFFFFFFn; // 64-bit mask (2^64 - 1)
    
    // Handle negative numbers using two's complement
    let workingValue = bigIntValue;
    if (bigIntValue < 0n) {
      // For negative, convert to two's complement: (2^128 + value)
      workingValue = (1n << 128n) + bigIntValue;
    }
    
    const lo = workingValue & mask64;
    const hi = (workingValue >> 64n) & mask64;
    
    // Convert to Int64 (signed) and Uint64 (unsigned)
    // Int64 can handle negative values, Uint64 is always positive
    const int64Hi = this.sdk.xdr.Int64.fromString(hi.toString());
    const uint64Lo = this.sdk.xdr.Uint64.fromString(lo.toString());
    
    // Create Int128Parts
    const parts = new this.sdk.xdr.Int128Parts({
      hi: int64Hi,
      lo: uint64Lo
    });
    
    // Create ScVal with i128 type
    return this.sdk.xdr.ScVal.scvI128(parts);
  }

  async nativeToScValAddress(address: string) {
    await this.initialize();
    return this.sdk.Address.fromString(address).toScVal();
  }

  async scValToBigInt(scVal: any) {
    await this.initialize();
    return this.sdk.scValToBigInt(scVal);
  }

  async addressToScVal(address: string) {
    await this.initialize();
    return this.sdk.Address.fromString(address).toScVal();
  }

  async stringToScVal(str: string) {
    await this.initialize();
    return this.sdk.nativeToScVal(str);
  }

  async numberToScVal(num: number) {
    await this.initialize();
    return this.sdk.nativeToScVal(num);
  }

  // ✅ Additional utility methods
  async createKeypair() {
    await this.initialize();
    return this.sdk.Keypair.random();
  }

  async signTransaction(transaction: any, secretKey: string) {
    await this.initialize();
    const keypair = this.sdk.Keypair.fromSecret(secretKey);
    transaction.sign(keypair);
    return transaction;
  }

  async submitTransaction(transaction: any) {
    await this.initialize();
    return await this.server.submitTransaction(transaction);
  }

  async getTransactionBuilder(sourceAccount: any) {
    await this.initialize();
    return new this.sdk.TransactionBuilder(sourceAccount, {
      fee: this.sdk.BASE_FEE,
      networkPassphrase: this.sdk.Networks.TESTNET,
    });
  }

  // ✅ Contract utilities
  async contractAddress(wasmHash: string, deployer: string) {
    await this.initialize();
    return this.sdk.Address.contract(
      this.sdk.StrKey.decodeContract(wasmHash),
      this.sdk.StrKey.decodeEd25519PublicKey(deployer)
    ).toString();
  }

  // ✅ Asset utilities
  async createAsset(code: string, issuer: string) {
    await this.initialize();
    return new this.sdk.Asset(code, issuer);
  }

  async isNativeAsset(asset: any) {
    await this.initialize();
    return asset.isNative();
  }

  // ✅ Network utilities
  async getNetworkPassphrase(network: 'testnet' | 'mainnet' | 'futurenet') {
    await this.initialize();
    switch (network) {
      case 'testnet':
        return this.sdk.Networks.TESTNET;
      case 'mainnet':
        return this.sdk.Networks.PUBLIC;
      case 'futurenet':
        return this.sdk.Networks.FUTURENET;
      default:
        return this.sdk.Networks.TESTNET;
    }
  }

  // ✅ Error handling utilities
  async isHorizonError(error: any) {
    await this.initialize();
    return error instanceof this.sdk.NotFoundError || 
           error instanceof this.sdk.BadRequestError ||
           error instanceof this.sdk.NetworkError;
  }

  // ✅ Soroban-specific methods using the configured server
  async getContractData(contractAddress: string) {
    await this.initialize();
    try {
      return await this.sorobanServer.getContractData(contractAddress);
    } catch (error) {
      console.error('Failed to get contract data:', error);
      throw error;
    }
  }

  async simulateTransaction(transaction: any) {
    await this.initialize();
    try {
      return await this.sorobanServer.simulateTransaction(transaction);
    } catch (error) {
      console.error('Failed to simulate transaction:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: any) {
    await this.initialize();
    try {
      return await this.sorobanServer.sendTransaction(transaction);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async getTransaction(hash: string) {
    await this.initialize();
    try {
      return await this.sorobanServer.getTransaction(hash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async getLatestLedger() {
    await this.initialize();
    try {
      return await this.sorobanServer.getLatestLedger();
    } catch (error) {
      console.error('Failed to get latest ledger:', error);
      throw error;
    }
  }

  // ✅ Helper method to get the configured HTTPS agent
  getHttpsAgent() {
    return this.httpsAgent;
  }

  // ✅ Method to update SSL configuration if needed
  updateSSLConfig(options: https.AgentOptions) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      timeout: 30000,
      maxSockets: 50,
      ...options,
    });
  }
}

export const stellarServer = new ServerStellarService();