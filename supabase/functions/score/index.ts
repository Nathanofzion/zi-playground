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

// 1 strop (0.000001 ZI) per point, 10 ZI lifetime cap per game type per account
const STROPS_PER_POINT = 1;
const LIFETIME_CAP_STROPS = 10_000_000; // 10 ZI
const MIN_SCORE_FOR_TRANSFER = 100; // Below this, tx fee exceeds reward

const createScore = async (createScoreDto: any) => {
  const { data, error: scoreError } = await supabase
    .from("scores")
    .insert(createScoreDto)
    .select()
    .single();
  if (scoreError) throw new Error(scoreError.message);
  if (!data) throw new Error("Failed to create score");

  if (data.score < MIN_SCORE_FOR_TRANSFER) {
    return { ...data, reward: 0, reason: "Score below minimum for token transfer" };
  }

  // Calculate lifetime rewards already given for this account + game type
  // Only count sessions that met the minimum threshold (those were actually rewarded)
  const { data: pastScores, error: historyError } = await supabase
    .from("scores")
    .select("score")
    .eq("publicKey", data.publicKey)
    .eq("type", data.type)
    .gte("score", MIN_SCORE_FOR_TRANSFER);

  if (historyError) throw new Error(historyError.message);

  // Exclude the current session from past rewards calculation
  const previousRewardedPoints = (pastScores || []).reduce(
    (sum: number, s: any) => sum + (s.score || 0), 0
  ) - data.score;
  const previousStrops = Math.min(
    Math.max(previousRewardedPoints, 0) * STROPS_PER_POINT,
    LIFETIME_CAP_STROPS
  );
  const remainingCap = LIFETIME_CAP_STROPS - previousStrops;

  if (remainingCap <= 0) {
    return { ...data, reward: 0, reason: "Lifetime reward cap reached for this game" };
  }

  const rewardStrops = Math.min(data.score * STROPS_PER_POINT, remainingCap);

  const result = await contractInvoke({
    contractAddress: zionTokenAddress,
    method: "transfer",
    secretKey: funderSecretKey,
    args: [
      nativeToScVal(funderPublicKey, { type: "address" }),
      nativeToScVal(data.publicKey, { type: "address" }),
      nativeToScVal(rewardStrops, { type: "i128" }),
    ],
  });

  if (result.status != "SUCCESS") {
    throw new Error("Failed to transfer reward");
  }

  return { ...data, reward: rewardStrops };
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
