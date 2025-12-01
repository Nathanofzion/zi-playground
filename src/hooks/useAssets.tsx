import axios from "axios";
import { useMemo } from "react";
import { v4 as uuid } from "uuid";

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
        return data.assets.map((asset: any) => ({ ...asset, id: uuid() }));
      } else {
        console.log("Network : ", activeChain.network);

        const { data } = await axios.get<
          { network: string; assets: IAsset[] }[]
        >("https://api.soroswap.finance/api/tokens");
        return [
          zionToken,
          ...(data.find((list) => list.network == activeChain.network)
            ?.assets ?? []),
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
          console.log("Asset : ", asset, " Contract : ", asset.contract);

          const balance = await tokenBalance(sorobanContext, asset.contract);
          return balance / Math.pow(10, asset.decimals);
        } catch (err: any) {
          // Handle specific error types gracefully
          if (err?.message?.includes("trustline")) {
            console.warn(`No trustline for ${asset.name || asset.contract}:`, err.message);
            return 0;
          }

          if (err?.message?.includes("MissingValue") || err?.message?.includes("contract instance")) {
            console.warn(`Contract not found for ${asset.name || asset.contract}:`, err.message);
            return 0;
          }

          if (err?.message?.includes("Contract, #13")) {
            console.warn(`Trustline missing for ${asset.name || asset.contract}:`, err.message);
            return 0;
          }

          // Log other errors but don't crash
          console.warn(`Balance fetch failed for ${asset.name || asset.contract}:`, err.message || err);
          return 0;
        }
      },
      enabled: !!address,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      // Add retry configuration to prevent excessive retries
      retry: (failureCount, error: any) => {
        // Don't retry for trustline/contract errors
        if (error?.message?.includes("trustline") ||
          error?.message?.includes("MissingValue") ||
          error?.message?.includes("Contract, #13")) {
          return false;
        }
        // Only retry network errors, max 2 times
        return failureCount < 2;
      },
      retryDelay: 2000, // Wait 2 seconds between retries
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