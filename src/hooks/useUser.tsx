import { useQuery } from "@tanstack/react-query";
import { useSorobanReact } from "@soroban-react/core";

import { supabase } from "@/lib/supabase";

const useUser = () => {
  const { address } = useSorobanReact();

  const { data: user } = useQuery({
    queryKey: ["user", address],
    queryFn: async () => {
      const token = localStorage.getItem("token");

      // Try JWT-based auth first
      if (token) {
        try {
          const { data, error } = await supabase.functions.invoke("auth", {
            method: "POST",
            body: { action: "profile", data: { token } },
          });

          if (!error) return data;

          // Token expired or invalid — clear it so reconnect generates a fresh one
          if (
            error.message?.includes("400") ||
            error.message?.includes("Invalid") ||
            error.message?.includes("expired")
          ) {
            localStorage.removeItem("token");
          }
          // Service errors: fall through to address lookup
          if (
            !error.message?.includes("546") &&
            !error.message?.includes("500") &&
            !error.message?.includes("timed out")
          ) {
            // non-service error (e.g. bad token) — fall through
          }
        } catch (err: any) {
          if (
            err.message?.includes("Invalid") ||
            err.message?.includes("expired") ||
            err.message?.includes("token")
          ) {
            localStorage.removeItem("token");
          }
        }
      }

      // Fallback: fetch by wallet address (no JWT required)
      if (address) {
        try {
          const { data, error } = await supabase.functions.invoke("auth", {
            method: "POST",
            body: { action: "profile-by-address", data: { publicKey: address } },
          });
          if (!error) return data;
        } catch (err: any) {
          console.warn("Failed to fetch user profile by address:", err.message);
        }
      }

      return null;
    },
    enabled: !!address,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000,
  });

  return { user };
};

export default useUser;
