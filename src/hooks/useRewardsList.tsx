import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

const useRewardsList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("rewards", {
        method: "POST",
        body: {
          action: "get-rewards-list",
          token: localStorage.getItem("token"),
        },
      });

      if (error) throw new Error(error.message);

      return data;
    },
  });

  return { rewardsList: data ?? [], isLoading, error };
};

export default useRewardsList;
