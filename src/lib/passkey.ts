/**
 * Legacy PasskeyID helpers (deprecated).
 *
 * The current implementation uses passkey-kit in passkeyClient.ts for
 * WebAuthn registration/authentication and transaction signing. These
 * helpers are intentionally disabled to prevent secret-key storage.
 */

export const handleRegister = async () => {
  throw new Error('Legacy PasskeyID flow disabled. Use passkey-kit connector.');
};

export const handleLogin = async () => {
  throw new Error('Legacy PasskeyID flow disabled. Use passkey-kit connector.');
};

export const handleSign = async (
  _xdr: string,
  _opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }
) => {
  throw new Error('Legacy PasskeyID signer disabled. Use passkey-kit connector.');
};