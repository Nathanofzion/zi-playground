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

// Timeout wrapper to prevent CPU time limit errors
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action, token } = await req.json();

      if (!token) {
        throw new BadRequestException("Token is required");
      }

      // Fast JWT format validation before expensive jwt.verify
      if (typeof token !== "string") {
        throw new BadRequestException("Token must be a string");
      }
      
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new BadRequestException("Invalid JWT format");
      }

      // jwt.verify is synchronous, catch errors immediately
      let decoded;
      try {
        decoded = jwt.verify(token, secretKey);
      } catch (error: any) {
        throw new BadRequestException(`Invalid or expired token: ${error.message}`);
      }

      if (!decoded || !(decoded as any).id) {
        throw new BadRequestException("Invalid token payload");
      }

      // Wrap all handlers with timeout protection
      switch (action) {
        case "get-rewards":
          return await withTimeout(handleGetRewards((decoded as any).id), 8000, "Get rewards timed out");
        case "get-rewards-list":
          return await withTimeout(handleGetRewardsList(), 8000, "Get rewards list timed out");
        case "claim-rewards":
          return await withTimeout(handleClaimRewards((decoded as any).id), 15000, "Claim rewards timed out");
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

  if (error) {
    // Return default values if user not found instead of throwing
    if (error.code === "PGRST116") {
      return {
        referral_count: 0,
        total_rewards: 0,
        claimed_rewards: 0,
        remaining_rewards: 0,
        history: [],
      };
    }
    throw new Error(error.message);
  }

  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select()
    .eq("user_id", user.id);

  // Don't throw on rewards error, just use empty array
  const rewardsList = rewardsError ? [] : (rewards || []);

  const referral_count = user.referral_count || 0;
  const total_rewards = referral_count * 10 + Math.floor(referral_count / 10) * 100;
  const claimed_rewards = user.claimed_rewards || 0;

  return {
    referral_count,
    total_rewards,
    claimed_rewards,
    remaining_rewards: Math.max(0, total_rewards - claimed_rewards),
    history: rewardsList,
  };
};

const handleClaimRewards = async (user_id: number) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, referral_count, claimed_rewards, publicKey")
    .eq("user_id", user_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new BadRequestException("User not found");
    }
    throw new Error(error.message);
  }

  if (!user.publicKey) {
    throw new BadRequestException("User public key not found");
  }

  const referral_count = user.referral_count || 0;
  const total_rewards = referral_count * 10 + Math.floor(referral_count / 10) * 100;
  const claimed_rewards = user.claimed_rewards || 0;
  const remaining_rewards = total_rewards - claimed_rewards;

  if (remaining_rewards <= 0) {
    throw new BadRequestException("No rewards to claim");
  }

  // Validate required env vars
  if (!zionTokenAddress || !funderSecretKey || !funderPublicKey) {
    throw new Error("Reward system not configured. Missing contract or funder keys.");
  }

  try {
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
      throw new Error(`Transaction failed with status: ${result.status}`);
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
      amount: remaining_rewards,
    };
  } catch (contractError: any) {
    // Log contract error but don't expose internal details
    console.error("Contract invocation failed:", contractError.message);
    throw new Error(`Failed to process reward claim: ${contractError.message}`);
  }
};

const handleGetRewardsList = async () => {
  const { data, error } = await supabase.from("rewards").select("*, users(email, publicKey)");

  if (error) throw new Error(error.message);

  return data;
};
