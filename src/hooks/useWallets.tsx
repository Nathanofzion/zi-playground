import { useCallback, useEffect, useRef, useState } from "react";

import { useSorobanReact } from "@soroban-react/core";

import { IWallet } from "@/interfaces";
import { connect } from "@/lib/wallet";

const useWallets = () => {
  const { address, connectors, setActiveConnectorAndConnect } = useSorobanReact();
  const addressRef = useRef<string>();
  const [wallets, setWallets] = useState<IWallet[]>([]);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const loadWallets = useCallback(async () => {
    const wallets = await Promise.all(connectors.map(async (connector) => ({
      id: connector.id,
      name: connector.name,
      sname: connector.shortName,
      iconUrl: typeof connector.iconUrl == 'string' ? connector.iconUrl : await connector.iconUrl(),
      isConnected: await connector.isConnected(),
      connect: async () => {
        const isConnected = await connect(connector);
        if (isConnected) {
          setActiveConnectorAndConnect?.(connector);
          while (!addressRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      },
    })));
    setWallets(wallets);
  }, [connectors, setActiveConnectorAndConnect]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  return wallets;
}

export default useWallets;
