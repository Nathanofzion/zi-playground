import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface IScore {
  [key: string]: number | string;
}

const useScore = () => {
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
    mutationFn: async (score: IScore) =>
      supabase.functions.invoke("score", {
        method: "POST",
        body: {
          action: "create",
          data: {
            publicKey: address,
            ...score,
          },
        },
      }),
  });

  return { scores: data, createScore };
};

export default useScore;
