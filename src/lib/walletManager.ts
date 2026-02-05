import { LocalKeyStorage } from './localKeyStorage';
import passkeyClient from './passkeyClient';
import { account } from './passkey-kit';
export interface WalletInfo {
  id: string;
  keyId: string;
  contractId: string;
  name: string;
  created: number;
  lastUsed: number;
  isActive: boolean;
}
export const getStoredWallets = (): WalletInfo[] => {
  const wallets = LocalKeyStorage.getPasskeyWallets();
  const activeIndex = LocalKeyStorage.getActiveWalletIndex();
  
  return wallets.map((w, index) => ({
    ...w,
    id: w.keyId, // Use keyId as ID
    isActive: index === activeIndex
  }));
};
export const createNamedWallet = async (name: string): Promise<WalletInfo> => {
  // 1. Create wallet via passkey-kit/client
  // We need to use account.createWallet directly or via a specific method in passkeyClient
  // tailored for just creation without setting global session immediately if we want to manage it here.
  // However, passkey-kit usually sets up the session.
  
  // Using passkeyClient to ensure consistent behavior with existing app
  // We need to request creation.
  
  // Actually, looking at passkeyClient.ts, it handles the complex creation logic.
  // We might want to use a method there.
  // But passkeyClient.getPublicKey() does discovery/creation.
  // We need explicit creation.
  
  console.log(`Creating wallet with name: ${name}`);
  
  // We'll use the account object from passkey-kit directly to create the credentials
  // This avoids the "discovery" logic in passkeyClient.getPublicKey
  
//   const {
//       keyIdBase64,
//       contractId,
//       signedTx,
//   } = await account.createWallet(
//       "ZI Playground",
//       name // Use the provided name as user handle/name
//   );
  
  // We need to submit the transaction. passkeyClient has logic for this (LaunchTube vs RPC).
  // Ideally we expose a method in passkeyClient to "submitWalletCreation(signedTx)".
  // For now, I'll rely on passkeyClient to have a helper or duplicate the submission logic carefully, 
  // OR better: I'll modify passkeyClient to export a `createWallet` function that does this.
  
  // Let's assume we will add `createPasskeyWallet` to passkeyClient.ts
  // For now, I'll import it (it will be added in next step).
  // If I can't import it yet, I'll implement the storage part here and call the client.
  
  // Using the imported passkeyClient to "boot" the creation if possible, 
  // but since we need to change passkeyClient anyway, let's look at how we want to structure it.
  
  // Let's defer the submission to a new method in passkeyClient we will create called `deployWalletContract`.
  // For this file, I will assume `passkeyClient.createNewWallet(name)` exists.
  
  const result = await (passkeyClient() as any).createNewWallet(name);
  
  const newWallet = {
    keyId: result.keyId,
    contractId: result.contractId,
    name: name,
    created: Date.now(),
    lastUsed: Date.now()
  };
  
  // Store in list
  LocalKeyStorage.addPasskeyWallet(newWallet);
  
  // Set as active
  const wallets = LocalKeyStorage.getPasskeyWallets();
  const index = wallets.findIndex(w => w.keyId === newWallet.keyId);
  if (index !== -1) {
      LocalKeyStorage.setActiveWalletIndex(index);
  }
  
  return {
    ...newWallet,
    id: newWallet.keyId,
    isActive: true
  };
};
export const connectToWallet = async (wallet: WalletInfo): Promise<void> => {
  const wallets = LocalKeyStorage.getPasskeyWallets();
  const index = wallets.findIndex(w => w.keyId === wallet.keyId);
  
  if (index === -1) {
    throw new Error('Wallet not found in local storage');
  }
  
  LocalKeyStorage.setActiveWalletIndex(index);
  LocalKeyStorage.updateWalletLastUsed(index);
  
  // Initialize simple wallet session for legacy support
  // This updates the "active" single-value keys for backward compatibility if needed
  // although we are moving away from them.
  // We'll let `passkeyClient.getPublicKey` handle the actual connection verification if needed.
  // But here we set the state so the next call to getPublicKey uses this wallet.
};
export const removeWallet = (walletId: string): void => {
  LocalKeyStorage.removePasskeyWallet(walletId);
};
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
export const getWalletDisplayName = (wallet: WalletInfo): string => {
  return wallet.name || `Wallet ${formatWalletAddress(wallet.contractId)}`;
};
