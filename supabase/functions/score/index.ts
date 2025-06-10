import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { nativeToScVal } from "npm:@stellar/stellar-sdk";
import {
  BadRequestException,
  handleException,
  MethodNotAllowedException
} from "../exceptions.ts";
import { contractInvoke } from "../contract.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabasekey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

const funderPublicKey = Deno.env.get("FUNDER_PUBLIC_KEY")!;
const funderSecretKey = Deno.env.get("FUNDER_SECRET_KEY")!;
const zionTokenAddress = Deno.env.get("ZION_TOKEN_ADDRESS")!;

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action, type, data } = await req.json();

      switch (action) {
        case "create":
          return createScore(data);
        case "read":
          return readScore(type);
        default:
          throw new BadRequestException();
      }
    }
    throw new MethodNotAllowedException();
  })
);

const createScore = async (createScoreDto: any) => {
  const { data, error: scoreError } = await supabase
    .from("scores")
    .insert(createScoreDto)
    .select()
    .single();
  if (scoreError) throw new Error(scoreError.message);
  if (!data) throw new Error("Failed to create score");

  const result = await contractInvoke({
    contractAddress: zionTokenAddress,
    method: "transfer",
    secretKey: funderSecretKey,
    args: [
      nativeToScVal(funderPublicKey, { type: "address" }),
      nativeToScVal(data.publicKey, { type: "address" }),
      nativeToScVal(data.score * 100, { type: "i128" }),
    ],
  });

  if (result.status != "SUCCESS") {
    throw new Error("Failed to create score");
  }

  return data;
};

const readScore = async (type: string) => {
  const { data, error } = await supabase
    .from("scores")
    .select()
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to read score");

  return data;
};
