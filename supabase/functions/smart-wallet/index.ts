// deno-lint-ignore-file no-explicit-any
// Setup type definitions for built-in Supabase Runtime APIs
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rpName = "Zi-playground";
const rpID = "localhost";
const origin = "http://localhost:3000";
// const rpID = "zi-playground-git-dev-to-journeys-projects.vercel.app";
// const origin = "https://zi-playground-git-dev-to-journeys-projects.vercel.app";

const secretKey = Deno.env.get("SECRET_KEY")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabasekey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    const { operation, user_id, challenge_id, data } = await req.json();

    switch (operation) {
      case "generate-registration-options":
        return handleRegistration();
      case "verify-registration":
        return handleRegistrationVerification(data, user_id);
      case "generate-authentication-options":
        return handleAuthentication(challenge_id);
      case "verify-authentication":
        return handleAuthenticationVerification(data, challenge_id);
      case "sign-transaction":
        return handleSignTransaction(data);
      default:
        return new Response(
          JSON.stringify({
            error: "Invalid operation",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }
  } else {
    return new Response("Method Not Allowed", {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 405,
    });
  }
});

// Registration Handler
async function handleRegistration() {
  // Generate registration options (challenge, etc.)
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "Smart wallet",
  });

  const { error } = await supabase
    .from("challenges")
    .insert({ user_id: options.user.id, challenge: options.challenge });

  if (error) {
    return new Response(JSON.stringify(error), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }

  return new Response(JSON.stringify(options), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Registration Verification Handler
async function handleRegistrationVerification(
  assertionResponse: any,
  user_id: string
) {
  try {
    const { data: challenge } = await supabase
      .from("challenges")
      .select()
      .eq("user_id", user_id)
      .single();
    if (!challenge) {
      return new Response("Challenge not found", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 404,
      });
    }
    // Delete the challenge after fetching it
    await supabase.from("challenges").delete().eq("user_id", user_id);

    // Verify the response from the client-side
    const verification = await verifyRegistrationResponse({
      response: assertionResponse,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      // Create stellar account
      const keypair = Keypair.random();
      await axios.get(
        `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
      );

      // Save the public key in the database
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

      const token = generateToken({
        id: user_id,
      });

      return new Response(
        JSON.stringify({ publicKey: keypair.publicKey(), token }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response("Verification failed", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      });
    }
  } catch (err: any) {
    return new Response(err.message, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
}

// Authentication Handler
async function handleAuthentication(challenge_id: string) {
  // Generate authentication options (challenge)
  const options = await generateAuthenticationOptions({
    rpID: rpID,
  });

  const { error } = await supabase
    .from("challenges")
    .insert({ challenge_id, challenge: options.challenge });

  if (error) {
    return new Response(JSON.stringify(error), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }

  // Send authentication options (challenge) back to client
  return new Response(JSON.stringify(options), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Authentication Verification Handler
async function handleAuthenticationVerification(
  assertionResponse: any,
  challenge_id: string
) {
  try {
    // Get the user details (including public key)
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select()
      .eq("challenge_id", challenge_id)
      .single();
    if (challengeError) {
      throw new Error(challengeError.message);
    }

    if (!challenge) {
      return new Response("Challenge not found", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 404,
      });
    }
    // Delete the challenge after fetching it
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
      return new Response("User not found", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 404,
      });
    }

    // Verify the response from the client-side
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
      id: user.id,
    });

    if (verification.verified) {
      return new Response(
        JSON.stringify({
          publicKey: user.publicKey,
          token,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response("Verification failed", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      });
    }
  } catch (err: any) {
    return new Response(err.message, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
}

const handleSignTransaction = async (data: any) => {
  const { token, xdr, opts } = data;

  try {
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
      return new Response("User not found", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 404,
      });
    }

    const keypair = Keypair.fromSecret(user.secretKey);

    const transaction = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);

    transaction.sign(keypair);

    return new Response(
      JSON.stringify({
        signedTxXdr: transaction.toXDR(),
        signerAddress: keypair.publicKey(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(err.message, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
};
