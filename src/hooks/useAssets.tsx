import axios from "axios";
import { useMemo } from "react";
import { v4 as uuid } from "uuid";

import { useSorobanReact } from "@soroban-react/core";
import { useQueries, useQuery } from "@tanstack/react-query";

import zionToken from "@/constants/zionToken";
import { IAsset } from "@/interfaces";

const useAssets = () => {
  const sorobanContext = useSorobanReact();
  const { address, activeChain } = sorobanContext;

  const { data } = useQuery<IAsset[]>({
    queryKey: ["asset", activeChain?.network],
    queryFn: async () => {
      if (!activeChain)
        throw new Error("Soroban context is not initialized yet!");
      if (activeChain.network == "mainnet") {
        const { data } = await axios.get(
          "https://raw.githubusercontent.com/soroswap/token-list/refs/heads/main/tokenList.json"
        );
        return data.assets.map((asset: any) => ({ ...asset, id: uuid() }));
      } else {
        console.log("Tokens Data Fetched!!!");
        // const { data } = await axios.get<
        //   { network: string; assets: IAsset[] }[]
        // >("https://api.soroswap.finance/api/tokens");
        // console.log("Token Data : ",data);
        
        return [
          zionToken,
          {
            "name": "Stellar Lumens",
            "contract": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
            "code": "XLM",
            "icon": "https://assets.coingecko.com/coins/images/100/standard/Stellar_symbol_black_RGB.png",
            "decimals": 7
          },
          // ...(data.find((list) => list.network == activeChain.network)
          //   ?.assets ?? []),
        ].map((asset: any) => ({ ...asset, id: uuid() }));
      }
    },
    enabled: !!activeChain,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const balanceTable = useQueries({
    queries: (data ?? []).map((asset) => ({
      queryKey: ["balance", address, asset.contract],
      queryFn: async () => {
        try {
          const res = await axios.get<{ balance: string }>(
            `/api/stellar/token-balance`,
            { params: { address, contract: asset.contract } }
          );
          const raw = BigInt(res.data.balance ?? '0');
          return Number(raw) / Math.pow(10, asset.decimals);
        } catch (err: any) {
          console.warn(`Balance fetch failed for ${asset.name || asset.contract}:`, err.message || err);
          return 0;
        }
      },
      enabled: !!address,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      retry: 1,
      retryDelay: 2000,
    })),
  });

  const assets = useMemo(() => {
    return (data ?? []).map((asset, index) => {
      return {
        ...asset,
        balance: balanceTable[index].data ?? 0,
        // Add loading and error states for better UX
        isLoadingBalance: balanceTable[index].isLoading,
        balanceError: balanceTable[index].error,
      };
    });
  }, [data, balanceTable]);

  return { assets };
};

export default useAssets;