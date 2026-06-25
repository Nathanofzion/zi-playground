import { useQuery } from "@tanstack/react-query";
import { useSorobanReact } from "@soroban-react/core";

import { supabase } from "@/lib/supabase";

const useUser = () => {
  const { address } = useSorobanReact();

  const { data: user } = useQuery({
    queryKey: ["user", address],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return null;
      }

      try {
        const { data, error } = await supabase.functions.invoke("auth", {
          method: "POST",
          body: {
            action: "profile",
            data: {
              token,
            },
          },
        });
        
        if (error) {
          // Don't throw on service errors - return null
          if (error.message?.includes("546") || error.message?.includes("500") || error.message?.includes("timed out")) {
            console.warn("Auth service unavailable");
            return null;
          }
          // Token expired or invalid — clear it so reconnect generates a fresh one
          if (error.message?.includes("400") || error.message?.includes("Invalid") || error.message?.includes("expired")) {
            localStorage.removeItem("token");
          }
          throw error;
        }
        return data;
      } catch (err: any) {
        // Clear stale tokens on auth failures
        if (err.message?.includes("Invalid") || err.message?.includes("expired") || err.message?.includes("token")) {
          localStorage.removeItem("token");
        }
        console.warn("Failed to fetch user profile:", err.message);
        return null;
      }
    },
    enabled: !!address,
    retry: 1, // Only retry once
    retryDelay: 1000,
    staleTime: 30000, // Cache for 30 seconds
  });

  return { user };
};

export default useUser;
