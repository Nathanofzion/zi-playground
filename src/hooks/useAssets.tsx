import axios from "axios";
import { useMemo } from "react";

import { useSorobanReact } from "@soroban-react/core";
import { useQueries, useQuery } from "@tanstack/react-query";

import zionToken from "@/constants/zionToken";
import { IAsset } from "@/interfaces";
import { tokenBalance } from "@/services/contract";

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
        return data.assets;
      } else {
        const { data } = await axios.get<
          { network: string; assets: IAsset[] }[]
        >("https://api.soroswap.finance/api/tokens");
        return [
          zionToken,
          ...(data.find((list) => list.network == activeChain.network)
            ?.assets ?? []),
        ];
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
          const balance = await tokenBalance(sorobanContext, asset.contract);
          return balance / Math.pow(10, asset.decimals);
        } catch (err) {
          console.error(err);
          return 0;
        }
      },
      enabled: !!address,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const assets = useMemo(() => {
    return (data ?? []).map((asset, index) => {
      return {
        ...asset,
        balance: balanceTable[index].data ?? 0,
      };
    });
  }, [data, balanceTable]);

  return { assets };
};

export default useAssets;
