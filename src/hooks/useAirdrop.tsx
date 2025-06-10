import axios from "axios";
import { useState } from "react";

import { useSorobanReact } from "@soroban-react/core";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import zionToken from "@/constants/zionToken";
import { Action } from "@/enums";
import { getAirdropStatus } from "@/services/contract";

const useAirdrop = () => {
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const status = useQueries({
    queries: [
      Action.Unknown,
      Action.ParticleSpinCube,
      Action.ParticleParticles,
      Action.ParticleTheme,
      Action.AtomicSpinCube,
      Action.AtomicAtoms,
      Action.AtomicTheme,
    ].map((action) => ({
      queryKey: ["airdrop-status", address, action],
      queryFn: async () => {
        if (!address || action === Action.Unknown) return false;
        return getAirdropStatus(sorobanContext, address, +action);
      },
      enabled: !!address,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const getAirdrop = async (action: number) => {
    try {
      setIsLoading(true);
      if (!address) throw new Error("Please connect wallet to get airdrop.");
      await axios.post("/api/airdrop", { address, action });
      queryClient.invalidateQueries({
        queryKey: ["balance", address, zionToken.contract],
      });
      queryClient.invalidateQueries({
        queryKey: ["airdrop-status", address, action],
      });
      toaster.create({
        title: "You have successfully received the airdrop.",
        type: "success",
      });
      return true;
    } catch (err: any) {
      toaster.create({
        title: `Error: ${err.message}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  return { status, getAirdrop, isLoading };
};

export default useAirdrop;
