import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handleRegister = async (username: string) => {
  const { data: optionsJSON } = await supabase.functions.invoke(
    "smart-wallet",
    {
      method: "POST",
      body: {
        operation: "generate-registration-options",
        username,
      },
    }
  );
  const regResponse = await startRegistration({ optionsJSON });
  const { data: result } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "verify-registration",
      username,
      data: regResponse,
    },
  });
  return result;
};

export const handleLogin = async (username: string) => {
  const { data: options } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "generate-authentication-options",
      username,
    },
  });
  const authResponse = await startAuthentication(options);
  const { data: result } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "verify-authentication",
      username,
      data: authResponse,
    },
  });
  return result;
};

export const handleSign = async (
  xdr: string,
  opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }
) => {
  const { data } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "sign-transaction",
      data: {
        token: localStorage.getItem("token"),
        xdr,
        opts,
      },
    },
  });
  return data.signedTxXdr;
};
