// Client-safe utilities without Stellar SDK

export const isValidStellarPublicKey = (publicKey: string): boolean => {
  if (!publicKey || typeof publicKey !== 'string') return false;
  if (!publicKey.startsWith('G')) return false;
  if (publicKey.length !== 56) return false;
  return /^G[A-Z2-7]{55}$/.test(publicKey);
};

export const formatStellarAddress = (address: string): string => {
  if (!address || address.length < 8) return address;
  return `${address.substring(0, 6)}...${address.substring(-4)}`;
};