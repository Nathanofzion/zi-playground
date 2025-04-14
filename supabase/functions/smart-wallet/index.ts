// deno-lint-ignore-file no-explicit-any
// Setup type definitions for built-in Supabase Runtime APIs
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "jsr:@simplewebauthn/server";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Keypair } from "npm:@stellar/stellar-sdk";
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
    const { operation, username, data } = await req.json();

    switch (operation) {
      case "generate-registration-options":
        return handleRegistration(username);
      case "verify-registration":
        return handleRegistrationVerification(data, username);
      case "generate-authentication-options":
        return handleAuthentication(username);
      case "verify-authentication":
        return handleAuthenticationVerification(data, username);
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
async function handleRegistration(username: string) {
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return new Response("User id already exist", {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 409,
    });
  }
  const { error } = await supabase.from("users").insert({
    username,
  });
  if (error) {
    return new Response(JSON.stringify(error), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }

  // Generate registration options (challenge, etc.)
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
  });

  await supabase
    .from("users")
    .update({
      challenge: options.challenge,
    })
    .eq("username", username);

  return new Response(JSON.stringify(options), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

// Registration Verification Handler
async function handleRegistrationVerification(
  assertionResponse: any,
  username: string
) {
  try {
    // Fetch the user details (including the challenge stored during registration)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, challenge")
      .eq("username", username)
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

    // Verify the response from the client-side
    const verification = await verifyRegistrationResponse({
      response: assertionResponse,
      expectedChallenge: user.challenge,
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
      const { error } = await supabase
        .from("users")
        .update({
          publicKey: keypair.publicKey(),
          secretKey: keypair.secret(),
          passkey_id: credential.id,
          passkey_public_key: uint8ArrayToArray(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports,
        })
        .eq("username", username);

      if (error) {
        throw new Error(error.message);
      }

      const token = generateToken({
        id: user.id,
      });

      return new Response(
        JSON.stringify({ publicKey: keypair.publicKey(), token }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
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
async function handleAuthentication(username: string) {
  // Get the user details (including public key)
  const { data: user } = await supabase
    .from("users")
    .select("id, challenge")
    .eq("username", username)
    .single();

  if (!user) {
    return new Response("User not found", {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 404,
    });
  }

  // Generate authentication options (challenge)
  const options = await generateAuthenticationOptions({
    rpID: rpID,
  });

  await supabase
    .from("users")
    .update({
      challenge: options.challenge,
    })
    .eq("username", username);

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
  username: string
) {
  try {
    // Get the user details (including public key)
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, publicKey, challenge, passkey_id, passkey_public_key, counter, transports"
      )
      .eq("username", username)
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

    // Verify the response from the client-side
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.challenge,
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
          status: 200,
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
