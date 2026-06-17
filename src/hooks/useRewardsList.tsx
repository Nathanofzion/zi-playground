import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

const useRewardsList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data, error } = await supabase.functions.invoke("rewards", {
        method: "POST",
        body: {
          action: "get-rewards-list",
          ...(token ? { token } : {}),
        },
      });

      if (error) {
        console.warn("Failed to fetch rewards list:", error.message);
        return [];
      }

      return data;
    },
    retry: 1,
  });

  return { rewardsList: data ?? [], isLoading, error };
};

export default useRewardsList;
