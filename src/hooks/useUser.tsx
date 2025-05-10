import { useQuery } from "@tanstack/react-query";
import { useSorobanReact } from "@soroban-react/core";

import { supabase } from "@/lib/supabase";

const useUser = () => {
  const { address } = useSorobanReact();

  const { data: user } = useQuery({
    queryKey: ["user", address],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("auth", {
        method: "POST",
        body: {
          action: "profile",
          data: {
            token: localStorage.getItem("token"),
          },
        },
      });
      if (error) {
        throw error;
      }
      return data.user;
    },
    enabled: !!address,
  });

  return { user };
};

export default useUser;
