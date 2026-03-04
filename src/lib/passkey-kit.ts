import { PasskeyKit, PasskeyServer, PasskeyClient } from "passkey-kit";
import { startRegistration, startAuthentication, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

/**
 * PasskeyKit instance for client-side passkey wallet operations
 * Handles wallet creation, connection, and transaction signing
 */
// Create PasskeyKit instance with timeoutInSeconds
// Note: timeoutInSeconds is not in TypeScript definitions but exists at runtime
const passkeyKitOptions = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  walletWasmHash: process.env.NEXT_PUBLIC_WALLET_WASM_HASH || "",
  timeoutInSeconds: 25,
  WebAuthn: {
    startRegistration: async (options: {
  optionsJSON: PublicKeyCredentialCreationOptionsJSON;
  useAutoRegister?: boolean;
}) => {
  const existing = options.optionsJSON.pubKeyCredParams ?? [];
  
  const requiredAlgs = [
    { type: "public-key" as const, alg: -7 },   // ES256
    { type: "public-key" as const, alg: -257 }, // RS256
  ];

  // Merge: keep existing, add required ones that aren't already present
  const existingAlgs = new Set(existing.map((p) => p.alg));
  const merged = [
    ...existing,
    ...requiredAlgs.filter((p) => !existingAlgs.has(p.alg)),
  ];

  const patchedOptions = {
    ...options,
    optionsJSON: {
      ...options.optionsJSON,
      pubKeyCredParams: merged,
    },
  };

  return startRegistration(patchedOptions);
},
    startAuthentication: async (options: {
      optionsJSON: PublicKeyCredentialRequestOptionsJSON;
      useBrowserAutofill?: boolean;
    }) => {
      // Pass authentication through unmodified
      return startAuthentication(options);
    },
  },
};

export const account = new PasskeyKit(passkeyKitOptions);

// Verify timeoutInSeconds was set
if ((account as any).timeoutInSeconds !== 25) {
  console.warn('timeoutInSeconds not set correctly, attempting to set directly...');
  (account as any).timeoutInSeconds = 25;
}

/**
 * PasskeyServer instance for server-side transaction submission
 * Handles transaction relay through configured service
 */
export const server = new PasskeyServer({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  launchtubeUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
  launchtubeJwt: process.env.NEXT_PUBLIC_RELAYER_API_KEY
});

/**
 * Set service headers for additional metadata
 * @param token - Turnstile token or other client token
 */
export function setServiceHeaders(token: string) {
  server.launchtubeHeaders = {
    'X-Client-Name': 'zi-playground',
    'X-Client-Version': process.env.npm_package_version || '1.0.0',
    'X-Turnstile-Response': token,
    'X-Service': 'OpenZeppelin-Relayer' // Identify the actual service being used
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
    console.log('PasskeyKit wallet initialized:', contractId.substring(0, 8) + '...');
  }
}