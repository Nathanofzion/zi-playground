// deno-lint-ignore-file no-explicit-any
// Setup type definitions for built-in Supabase Runtime APIs
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "jsr:@simplewebauthn/server";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rpName = Deno.env.get("SUPABASE_RP_NAME")!;
const rpID = Deno.env.get("SUPABASE_RP_ID")!;
const origin = Deno.env.get("SUPABASE_ORIGIN")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabasekey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabasekey);

Deno.serve(async (req: Request) => {
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 409,
    });
  }

  const { error } = await supabase.from("users").insert({ username });

  if (error) {
    return new Response(JSON.stringify(error), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Generate registration options (challenge, etc.)
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
  });

  return new Response(JSON.stringify(options), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Registration Verification Handler
async function handleRegistrationVerification(
  assertionResponse: any,
  username: string
) {
  // Fetch the user details (including the challenge stored during registration)
  const { data: user } = await supabase
    .from("users")
    .select("id, challenge, public_key")
    .eq("id", username)
    .single();

  if (!user) {
    return new Response("User not found", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
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
        .update({
          public_key: verification.registrationInfo?.credential.publicKey,
        })
        .eq("id", username);

      if (error) {
        return new Response("Failed to store public key", {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      return new Response("Registration successful", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response("Verification failed", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (err) {
    console.error(err);
    return new Response("Error during verification", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

// Authentication Handler
async function handleAuthentication(username: string) {
  // Get the user details (including public key)
  const { data: user } = await supabase
    .from("users")
    .select("id, public_key, challenge")
    .eq("id", username)
    .single();

  if (!user) {
    return new Response("User not found", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  // Generate authentication options (challenge)
  const options = await generateAuthenticationOptions({
    rpID: rpID,
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
  username: string
) {
  // Get the user details (including public key)
  const { data: user } = await supabase
    .from("users")
    .select("id, public_key, challenge")
    .eq("id", username)
    .single();

  if (!user) {
    return new Response("User not found", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  // Verify the response from the client-side
  try {
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (verification.verified) {
      return new Response("Authentication successful", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response("Verification failed", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (err) {
    console.error(err);
    return new Response("Error during verification", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}
