import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handleRegister = async () => {
  try {
    const { data: options } = await supabase.functions.invoke("smart-wallet", {
      method: "POST",
      body: {
        operation: "generate-registration-options",
      },
    });
    const regResponse = await startRegistration({
      optionsJSON: options,
    });
    const { data: result } = await supabase.functions.invoke("smart-wallet", {
      method: "POST",
      body: {
        operation: "verify-registration",
        data: regResponse,
      },
    });
    return result;
  } catch (error) {
    console.error("Error during registration:", error);
  }
};

export const handleLogin = async () => {
  try {
    const { data: options } = await supabase.functions.invoke("smart-wallet", {
      method: "POST",
      body: {
        operation: "generate-authentication-options",
      },
    });
    const authResponse = await startAuthentication(options);
    const { data: result } = await supabase.functions.invoke("smart-wallet", {
      method: "POST",
      body: {
        operation: "verify-authentication",
        data: authResponse,
      },
    });
    return result;
  } catch (error) {
    console.error("Error during authentication:", error);
  }
};
