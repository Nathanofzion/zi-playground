// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "jsr:@supabase/supabase-js@2";
import { nativeToScVal } from "npm:@stellar/stellar-sdk";
import { simulateTransaction } from "../contract.ts";
import { handleException, MethodNotAllowedException } from "../exceptions.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabasekey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

const soroswapFactory = Deno.env.get("SOROSWAP_FACTORY")!;

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action } = await req.json();

      switch (action) {
        case "sync":
          return syncPairs();
        case "all-pairs":
          return getPairs();
      }
    }
    throw new MethodNotAllowedException();
  })
);

// Get all liquidity pairs
async function syncPairs() {
  const pairsCount = await simulateTransaction({
    contractAddress: soroswapFactory,
    method: "all_pairs_length",
  });

  for (let i = 0; i < pairsCount; i++) {
    const contract = await simulateTransaction({
      contractAddress: soroswapFactory,
      method: "all_pairs",
      args: [nativeToScVal(i, { type: "u32" })],
    });

    const token_a = await simulateTransaction({
      contractAddress: contract,
      method: "token_0",
    });

    const token_b = await simulateTransaction({
      contractAddress: contract,
      method: "token_1",
    });

    const decimals = await simulateTransaction({
      contractAddress: contract,
      method: "decimals",
    });

    const name = await simulateTransaction({
      contractAddress: contract,
      method: "name",
    });

    const code = await simulateTransaction({
      contractAddress: contract,
      method: "symbol",
    });

    const { error } = await supabase.from("pairs").insert({
      contract,
      token_a,
      token_b,
      decimals,
      name,
      code,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return "Successfully synced pairs with onChain";
}

async function getPairs() {
  const { data, error } = await supabase.from("pairs").select();
  if (error) throw new Error(error.message);
  return data;
}
