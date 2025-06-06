import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import { GameType } from "@/enums";
import { supabase } from "@/lib/supabase";

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
    queryKey: ["score", address],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke(`score?type=${type}`, {
        method: "POST",
        body: {
          action: "read",
        },
      });
      return data;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: createScore } = useMutation({
    mutationFn: async (score: number) => {
      if (!address) {
        throw new Error("You have to connect wallet to submit your score.");
      }
      const { data } = await supabase.functions.invoke("score", {
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
      return data;
    },
    onSuccess: () => {
      toaster.create({
        type: "success",
        title: "Your score has been submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["score", address] });
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
