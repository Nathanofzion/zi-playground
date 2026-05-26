import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import { GameType } from "@/enums";
import { supabase } from "@/lib/supabase";
import zionToken from "@/constants/zionToken";

export interface IScore {
  id: string;
  publicKey: string;
  type: GameType;
  score: number;
  created_at: string;
}

const useScore = (type: string) => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const { data } = useQuery<IScore[]>({
    queryKey: ["score", type],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("score", {
        method: "POST",
        body: {
          action: "read",
          type,
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: createScore } = useMutation({
    mutationFn: async (score: number) => {
      if (!address) {
        console.warn("Score not submitted: wallet not connected");
        return null;
      }
      if (score <= 0) {
        console.warn("Score not submitted: score must be greater than 0");
        return null;
      }
      const { data, error } = await supabase.functions.invoke("score", {
        method: "POST",
        body: {
          action: "create",
          data: {
            publicKey: address,
            type,
            score,
          },
        },
      });
      if (error) {
        throw new Error(error.message);
      }

      // Distribute ZI reward: 0.000001 ZI per point via server-side transfer
      try {
        await fetch("/api/game-reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, score, gameType: type }),
        });
        // Invalidate balance so it refreshes after reward
        queryClient.invalidateQueries({
          queryKey: ["balance", address, zionToken.contract],
        });
      } catch (rewardErr: any) {
        // Non-fatal — score was saved, reward may retry next game
        console.warn("ZI reward distribution failed:", rewardErr?.message ?? rewardErr);
      }

      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      toaster.create({
        type: "success",
        title: "Your score has been submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["score", type] });
    },
    onError: (error) => {
      toaster.create({
        type: "error",
        title: error.message,
      });
    },
  });

  return { scores: data, createScore };
};

export default useScore;
