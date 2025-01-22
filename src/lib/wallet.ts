import { Connector } from "@soroban-react/types";

export const connect = async (connector: Connector) => {
    const isConnected = await connector.isConnected();
    if (!isConnected) {
        const userAgent = navigator.userAgent;
        if (/android/i.test(userAgent)) {
            window.open(connector.downloadUrls?.android, '_blank');
        } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
            window.open(connector.downloadUrls?.ios, '_blank');
        } else {
            window.open(connector.downloadUrls?.browserExtension, '_blank');
        }
        return;
    }
}