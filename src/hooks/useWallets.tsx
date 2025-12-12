import { useCallback, useEffect, useRef, useState } from "react";

import { useSorobanReact } from "@soroban-react/core";

import { IWallet } from "@/interfaces";

const useWallets = () => {
  const { address, connectors, setActiveConnectorAndConnect, activeConnector , connect } = useSorobanReact();
  const addressRef = useRef<string>();
  const [wallets, setWallets] = useState<IWallet[]>([]);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const connectWithTimeout = async (fn: any, timeout = 30000) => {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection not responding")), timeout)
      ),
    ]);
  };

  const loadWallets = useCallback(async () => {
    const wallets = await Promise.all(connectors.map(async (connector) => ({
      id: connector.id,
      name: connector.name,
      sname: connector.shortName,
      iconUrl: typeof connector.iconUrl == 'string' ? connector.iconUrl : await connector.iconUrl(),
      isConnected: await connector.isConnected(),
      connect: async () => {
        // const isConnected = await extensionCheck(connector);
        // if (isConnected) {

        console.log("Connector At Connect : ",connector);
        

        try {
          if(activeConnector?.id == connector.id){
            // await connect()
            await connectWithTimeout(connect, 30000);
          }else{
            await setActiveConnectorAndConnect?.(connector);
            // while (!addressRef.current) {
            //   await new Promise((resolve) => setTimeout(resolve, 500));
            // }
          } 
        } catch (error) {
          console.log("Error Connecting Wallet : ",error);

          if(error == "The user rejected this request." || error == "User declined access" || error == "Error: Lobstr is not connected"){
            return;
          }

          if(connector.id !== 'passkey'){
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
          }
          
        }

          
        // }
      },
      installed: connector.installed ?? false
    })));
    setWallets(wallets);
  }, [connectors, setActiveConnectorAndConnect]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  return wallets;
}

export default useWallets;
