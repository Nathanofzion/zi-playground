import { useSorobanReact } from "@soroban-react/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toaster } from "@/components/ui/toaster";
import zionToken from "@/constants/zionToken";
import { supabase } from "@/lib/supabase";

const useRewards = () => {
  const queryClient = useQueryClient();
  const { address } = useSorobanReact();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rewards", address],
    queryFn: () => {
      if (!address) return null;

      return supabase.functions.invoke("rewards", {
        method: "POST",
        body: {
          action: "get-rewards",
          token: localStorage.getItem("token"),
        },
      });
    },
    enabled: !!address,
  });

  const { mutate: claimRewards, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("rewards", {
        method: "POST",
        body: {
          action: "claim-rewards",
          token: localStorage.getItem("token"),
        },
      });

      if (error) throw new Error(error.message);

      return data;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["balance", address, zionToken.contract],
      });
      toaster.create({
        title: "You have claimed rewards successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      toaster.create({
        title: error instanceof Error ? error.message : (error as string),
        type: "error",
      });
    },
  });

  return {
    rewards: data?.data ?? { referral_count: 0 },
    claimRewards,
    isClaiming: isPending,
    isLoading,
  };
};

export default useRewards;
