import { Connector } from "@soroban-react/types";

export const connect = async (connector: Connector) => {
  const isConnected = await connector.isConnected();
  if (!isConnected) {
    // Check if this is a passkey connector
    if (connector.id === 'passkey') {
      // For passkeys, we need to call getPublicKey to trigger the connection flow
      try {
        await connector.getPublicKey();
        return true;
      } catch (error) {
        console.error('Passkey connection failed:', error);
        return false;
      }
    } else {
      // For other wallets (Freighter, Lobstr), open download URLs
      const userAgent = navigator.userAgent;
      if (/android/i.test(userAgent)) {
        console.log("Android Download Called!!!");
        window.open(connector.downloadUrls?.android, "_blank");
      } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
        console.log("Ios Download Called!!!");
        window.open(connector.downloadUrls?.ios, "_blank");
      } else {
        window.open(connector.downloadUrls?.browserExtension, "_blank");
      }
      return false;
    }
  }
  return true;
};
