import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handleRegister = async () => {
  const { data: options } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "generate-registration-options",
    },
  });
  const regResponse = await startRegistration({ optionsJSON: options });
  const { data: result } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "verify-registration",
      user_id: options.user.id,
      data: regResponse,
    },
  });
  return result;
};

export const handleLogin = async () => {
  const challenge_id = uuid();
  const { data: options } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "generate-authentication-options",
      challenge_id,
    },
  });
  const authResponse = await startAuthentication(options);
  const { data: result } = await supabase.functions.invoke("smart-wallet", {
    method: "POST",
    body: {
      operation: "verify-authentication",
      challenge_id,
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
