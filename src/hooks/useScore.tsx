import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import { supabase } from "@/lib/supabase";

export interface IScore {
  [key: string]: number | string;
}

const useScore = () => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;

  const { data } = useQuery<IScore[]>({
    queryKey: ["score", address],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("score", {
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
    mutationFn: async (score: IScore) => {
      if (!address) {
        toaster.create({
          type: "error",
          title: "You have to connect wallet to submit your score.",
        });
        return;
      }
      supabase.functions.invoke("score", {
        method: "POST",
        body: {
          action: "create",
          data: {
            publicKey: address,
            ...score,
          },
        },
      });
    },
    onSuccess: () => {
      toaster.create({
        type: "success",
        title: "Your score has been submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["score", address] });
    },
  });

  return { scores: data, createScore };
};

export default useScore;
