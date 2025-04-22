import { useMemo } from "react";

import { useSorobanReact } from "@soroban-react/core";
import { useQueries, useQuery } from "@tanstack/react-query";

import { IPair } from "@/interfaces";
import { supabase } from "@/lib/supabase";
import { tokenBalance } from "@/services/contract";

const usePairs = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const { data } = useQuery<IPair[]>({
    queryKey: ["pairs"],
    queryFn: async () => {
      const { data: pairs } = await supabase.functions.invoke("soroswap", {
        method: "POST",
        body: {
          action: "all-pairs",
        },
      });
      return pairs;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const balanceTable = useQueries({
    queries: (data ?? []).map((pair) => ({
      queryKey: ["balance", address, pair.contract],
      queryFn: async () => {
        try {
          const balance = await tokenBalance(sorobanContext, pair.contract);
          return balance / Math.pow(10, pair.decimals);
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

  const pairs = useMemo(() => {
    return (data ?? []).map((pair, index) => {
      return {
        ...pair,
        balance: balanceTable[index].data ?? 0,
      };
    });
  }, [data, balanceTable]);

  return { pairs };
};

export default usePairs;
