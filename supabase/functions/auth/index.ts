// deno-lint-ignore-file no-explicit-any
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "jsr:@simplewebauthn/server";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Keypair, TransactionBuilder } from "npm:@stellar/stellar-sdk";
import axios from "npm:axios";
import jwt from "npm:jsonwebtoken";

// Inline exceptions
class BadRequestException extends Error {
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestException";
  }
}

class NotFoundException extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFoundException";
  }
}

class MethodNotAllowedException extends Error {
  constructor(message = "Method Not Allowed") {
    super(message);
    this.name = "MethodNotAllowedException";
  }
}

async function handleException(fn: () => Promise<any>) {
  try {
    const result = await fn();
    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status: 200
    });
  } catch (error) {
    let status = 500;
    if (error instanceof BadRequestException) status = 400;
    if (error instanceof NotFoundException) status = 404;
    if (error instanceof MethodNotAllowedException) status = 405;
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status
    });
  }
}

// Updated environment variables
const supabaseUrl = Deno.env.get("APP_SUPABASE_URL")!;
const supabasekey = Deno.env.get("APP_SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

const rpName = Deno.env.get("RP_NAME")!;
const rpID = Deno.env.get("RP_ID")!;
const origin = Deno.env.get("ORIGIN")!;

const secretKey = Deno.env.get("SECRET_KEY")!;

function arrayToUint8Array(array: number[]) {
  return new Uint8Array(array);
}

function uint8ArrayToArray(uint8Array: Uint8Array) {
  return Array.from(uint8Array);
}

function generateToken(payload: any) {
  const options = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, secretKey, options);
}

Deno.serve((req) =>
  handleException(async () => {
    if (req.method === "OPTIONS") return null;

    if (req.method === "POST") {
      const { action, user_id, referrer, challenge_id, data } =
        await req.json();

      switch (action) {
        case "profile":
          return handleProfile(data);
        case "update-profile":
          return handleUpdateProfile(data);
        case "generate-registration-options":
          return handleRegistration();
        case "verify-registration":
          return handleRegistrationVerification(data, user_id, referrer);
        case "generate-authentication-options":
          return handleAuthentication(challenge_id);
        case "verify-authentication":
          return handleAuthenticationVerification(data, challenge_id);
        case "sign-transaction":
          return handleSignTransaction(data);
        default:
          throw new BadRequestException();
      }
    }
    throw new MethodNotAllowedException();
  })
);

async function handleProfile(data: any) {
  const { token } = data;
  const decoded = jwt.verify(token, secretKey);
  const { data: user, error } = await supabase
    .from("users")
    .select("id, publicKey, email, role")
    .eq("user_id", decoded.id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return user;
}

async function handleRegistration() {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "Smart wallet",
  });

  const { error } = await supabase
    .from("challenges")
    .insert({ user_id: options.user.id, challenge: options.challenge });

  if (error) {
    throw new Error(error.message);
  }

  return options;
}

async function handleRegistrationVerification(
  assertionResponse: any,
  user_id: string,
  referrer: string
) {
  const { data: challenge } = await supabase
    .from("challenges")
    .select()
    .eq("user_id", user_id)
    .single();
  if (!challenge) {
    throw new NotFoundException();
  }
  await supabase.from("challenges").delete().eq("user_id", user_id);

  const verification = await verifyRegistrationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified) {
    const keypair = Keypair.random();
    await axios.get(
      `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
    );

    const credential = verification.registrationInfo!.credential;
    const { error } = await supabase.from("users").insert({
      user_id: user_id,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      passkey_id: credential.id,
      passkey_public_key: uint8ArrayToArray(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (referrer) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, referral_count")
        .eq("publicKey", referrer)
        .single();
      if (userError) {
        throw new Error(userError.message);
      }
      const { error: updateError } = await supabase
        .from("users")
        .update({
          referral_count: user.referral_count + 1,
        })
        .eq("publicKey", referrer);
      if (updateError) {
        throw new Error(updateError.message);
      }
      const { error: rewardError } = await supabase.from("rewards").insert({
        user_id: user.id,
        type: "invited",
        amount: 1,
      });
      if (rewardError) {
        throw new Error(rewardError.message);
      }
    }

    const token = generateToken({
      id: user_id,
    });

    return { publicKey: keypair.publicKey(), token };
  } else {
    throw new BadRequestException("Verification failed");
  }
}

async function handleAuthentication(challenge_id: string) {
  const options = await generateAuthenticationOptions({
    rpID: rpID,
  });

  const { error } = await supabase
    .from("challenges")
    .insert({ challenge_id, challenge: options.challenge });

  if (error) {
    throw new Error(error.message);
  }

  return options;
}

async function handleAuthenticationVerification(
  assertionResponse: any,
  challenge_id: string
) {
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select()
    .eq("challenge_id", challenge_id)
    .single();
  if (challengeError) {
    throw new Error(challengeError.message);
  }

  if (!challenge) {
    throw new NotFoundException("Challenge not found");
  }
  await supabase.from("challenges").delete().eq("challenge_id", challenge_id);

  const user_id = assertionResponse.response.userHandle;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select()
    .eq("user_id", user_id)
    .single();
  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: user.passkey_id,
      publicKey: arrayToUint8Array(user.passkey_public_key),
      counter: user.counter,
      transports: user.transports,
    },
  });

  const token = generateToken({
    id: user.user_id,
  });

  if (verification.verified) {
    return {
      publicKey: user.publicKey,
      token,
    };
  } else {
    throw new BadRequestException("Verification failed");
  }
}

const handleSignTransaction = async (data: any) => {
  const { token, xdr, opts } = data;

  const decoded = jwt.verify(token, secretKey);
  const { data: user, error } = await supabase
    .from("users")
    .select()
    .eq("user_id", decoded.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const keypair = Keypair.fromSecret(user.secretKey);

  const transaction = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);

  transaction.sign(keypair);

  return {
    signedTxXdr: transaction.toXDR(),
    signerAddress: keypair.publicKey(),
  };
};

const handleUpdateProfile = async (data: any) => {
  const { token, email } = data;

  const decoded = jwt.verify(token, secretKey);

  const { error: updateError } = await supabase
    .from("users")
    .update({ email })
    .eq("user_id", decoded.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    message: "Profile updated successfully",
  };
};