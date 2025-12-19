import { PasskeyKit, PasskeyServer, PasskeyClient } from "passkey-kit";

/**
 * PasskeyKit instance for client-side passkey wallet operations
 * Handles wallet creation, connection, and transaction signing
 */
// Create PasskeyKit instance with timeoutInSeconds
// Note: timeoutInSeconds is not in TypeScript definitions but exists at runtime
const passkeyKitOptions: any = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  walletWasmHash: process.env.NEXT_PUBLIC_WALLET_WASM_HASH || "",
  timeoutInSeconds: 30, // LaunchTube requires maxTime within 30 seconds, so use 25 for safety
};

export const account = new PasskeyKit(passkeyKitOptions);

// Verify timeoutInSeconds was set
if ((account as any).timeoutInSeconds !== 25) {
  console.warn('⚠️ timeoutInSeconds not set correctly, attempting to set directly...');
  (account as any).timeoutInSeconds = 25;
}

/**
 * PasskeyServer instance for server-side transaction submission
 * Handles LaunchTube integration for gasless transactions
 */
export const server = new PasskeyServer({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  launchtubeUrl: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
  launchtubeJwt: process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT,
});

/**
 * Set LaunchTube headers for additional metadata
 * @param token - Turnstile token or other client token
 */
export function setLTHeaders(token: string) {
  // @ts-ignore - launchtubeHeaders exists but may not be in type definitions
  server.launchtubeHeaders = {
    'X-Client-Name': 'zi-playground',
    'X-Client-Version': process.env.npm_package_version || '1.0.0',
    'X-Turnstile-Response': token,
  };
}

/**
 * Initialize account.wallet with contractId
 * This is needed when reconnecting to an existing wallet
 * @param contractId - The contract ID (C-address) of the wallet
 */
export function initializeWallet(contractId: string) {
  if (!account.wallet || account.wallet.options.contractId !== contractId) {
    account.wallet = new PasskeyClient({
      contractId,
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
      networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
    });
    console.log('✅ PasskeyKit wallet initialized:', contractId.substring(0, 8) + '...');
  }
}

