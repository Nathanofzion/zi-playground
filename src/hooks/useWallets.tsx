import { IWallet } from "@/interfaces";
import { useSorobanReact } from "@soroban-react/core";
import { useEffect, useState } from "react";

const useWallets = () => {
    const { connectors } = useSorobanReact();
    const [wallets, setWallets] = useState<IWallet[]>([]);

    useEffect(() => {
        (async () => {
            const wallets = await Promise.all(connectors.map(async (connector) => ({
                id: connector.id,
                name: connector.name,
                sname: connector.shortName,
                iconUrl: typeof connector.iconUrl == 'string' ? connector.iconUrl : await connector.iconUrl(),
                isConnected: await connector.isConnected(),
            })));
            setWallets(wallets);
        })();
    }, [connectors]);

    return wallets;
}

export default useWallets;
