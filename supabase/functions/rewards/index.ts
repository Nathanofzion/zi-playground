import { createClient } from "jsr:@supabase/supabase-js@2";
import { nativeToScVal } from "npm:@stellar/stellar-sdk";
import jwt from "npm:jsonwebtoken";
import { contractInvoke } from "../contract.ts";
import {
  BadRequestException,
  handleException,
  MethodNotAllowedException,
} from "../exceptions.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabasekey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

const secretKey = Deno.env.get("SECRET_KEY")!;

const funderPublicKey = Deno.env.get("FUNDER_PUBLIC_KEY")!;
const funderSecretKey = Deno.env.get("FUNDER_SECRET_KEY")!;
const zionTokenAddress = Deno.env.get("ZION_TOKEN_ADDRESS")!;

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action, token } = await req.json();

      const decoded = jwt.verify(token, secretKey);

      switch (action) {
        case "get-rewards":
          return handleGetRewards(decoded.id);
        case "get-rewards-list":
          return handleGetRewardsList();
        case "claim-rewards":
          return handleClaimRewards(decoded.id);
        default:
          throw new BadRequestException("Invalid action");
      }
    }
    throw new MethodNotAllowedException();
  })
);

const handleGetRewards = async (user_id: number) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, referral_count, claimed_rewards")
    .eq("user_id", user_id)
    .single();

  if (error) throw new Error(error.message);

  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select()
    .eq("user_id", user.id);

  if (rewardsError) throw new Error(rewardsError.message);

  const referral_count = user.referral_count;
  const total_rewards = referral_count * 10 + Math.floor(referral_count / 10) * 100;
  const claimed_rewards = user.claimed_rewards;

  return {
    referral_count,
    total_rewards,
    claimed_rewards,
    remaining_rewards: total_rewards - claimed_rewards,
    history: rewards,
  };
};

const handleClaimRewards = async (user_id: number) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, referral_count, claimed_rewards, publicKey")
    .eq("user_id", user_id)
    .single();

  if (error) throw new Error(error.message);

  const referral_count = user.referral_count;
  const total_rewards = referral_count * 10 + Math.floor(referral_count / 10) * 100;
  const claimed_rewards = user.claimed_rewards;
  const remaining_rewards = total_rewards - claimed_rewards;

  if (claimed_rewards >= total_rewards) {
    throw new BadRequestException("No rewards to claim");
  }

  const result = await contractInvoke({
    contractAddress: zionTokenAddress,
    method: "transfer",
    secretKey: funderSecretKey,
    args: [
      nativeToScVal(funderPublicKey, { type: "address" }),
      nativeToScVal(user.publicKey, { type: "address" }),
      nativeToScVal(remaining_rewards * 1e7, { type: "i128" }),
    ],
  });

  if (result.status != "SUCCESS") {
    throw new Error("Failed to claim rewards");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ claimed_rewards: total_rewards })
    .eq("user_id", user_id);

  if (updateError) throw new Error(updateError.message);

  const { error: rewardError } = await supabase.from("rewards").insert({
    user_id: user.id,
    type: "claimed",
    amount: remaining_rewards,
  });

  if (rewardError) throw new Error(rewardError.message);

  return {
    success: true,
  };
};

const handleGetRewardsList = async () => {
  const { data, error } = await supabase.from("rewards").select("*, users(email, publicKey)");

  if (error) throw new Error(error.message);

  return data;
};
