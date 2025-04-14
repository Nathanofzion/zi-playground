import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { createClient } from "@supabase/supabase-js";
import { serve } from "std/server";

const supabaseUrl = Deno.env.SUPABASE_URL;
const supabaseKey = Deno.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rpName = Deno.env.SUPABASE_RP_NAME;
const rpID = Deno.env.SUPABASE_RP_ID;
const origin = Deno.env.SUPABASE_ORIGIN;

serve(async (req) => {
  const { method } = req;

  // Handle registration and authentication requests
  if (method === "POST") {
    const { action, user_id, assertionResponse } = await req.json();

    if (action === "register") {
      return handleRegistration(user_id);
    }

    if (action === "authenticate") {
      return handleAuthentication(user_id, assertionResponse);
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
});

// Registration Handler
async function handleRegistration(user_id: string) {
  // Get the user details from the database
  const { data: user } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", user_id)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Generate registration options (challenge, etc.)
  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.username,
    attestationType: "indirect", // Optional
  });

  // Save the challenge and user ID in the database for later verification
  const { error } = await supabase
    .from("users")
    .update({ challenge: options.challenge })
    .eq("id", user_id);

  if (error) {
    return new Response("Failed to store challenge", { status: 500 });
  }

  return new Response(JSON.stringify(options), {
    headers: { "Content-Type": "application/json" },
  });
}

// Registration Verification Handler
async function handleRegistrationVerification(
  assertionResponse: any,
  user_id: string
) {
  // Fetch the user details (including the challenge stored during registration)
  const { data: user } = await supabase
    .from("users")
    .select("id, challenge, public_key")
    .eq("id", user_id)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Verify the response from the client-side
  try {
    const verification = await verifyRegistrationResponse({
      response: assertionResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      // Save the public key in the database
      const { error } = await supabase
        .from("users")
        .update({ public_key: verification.registrationInfo.publicKey })
        .eq("id", user_id);

      if (error) {
        return new Response("Failed to store public key", { status: 500 });
      }

      return new Response("Registration successful", { status: 200 });
    } else {
      return new Response("Verification failed", { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return new Response("Error during verification", { status: 500 });
  }
}

// Authentication Handler
async function handleAuthentication(user_id: string, assertionResponse: any) {
  // Get the user details (including public key)
  const { data: user } = await supabase
    .from("users")
    .select("id, public_key, challenge")
    .eq("id", user_id)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Generate authentication options (challenge)
  const options = generateAuthenticationOptions({
    allowCredentials: [
      {
        id: user.public_key, // Public key stored in the database
        type: "public-key",
      },
    ],
    challenge: user.challenge,
  });

  // Send authentication options (challenge) back to client
  return new Response(JSON.stringify(options), {
    headers: { "Content-Type": "application/json" },
  });
}

// Authentication Verification Handler
async function handleAuthenticationVerification(
  assertionResponse: any,
  user_id: string
) {
  // Get the user details (including public key)
  const { data: user } = await supabase
    .from("users")
    .select("id, public_key, challenge")
    .eq("id", user_id)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Verify the response from the client-side
  try {
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: user.public_key,
    });

    if (verification.verified) {
      // Update last login, or perform any additional steps
      return new Response("Authentication successful", { status: 200 });
    } else {
      return new Response("Verification failed", { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return new Response("Error during verification", { status: 500 });
  }
}
