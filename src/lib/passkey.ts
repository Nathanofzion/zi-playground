import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { v4 as uuid } from "uuid";
import { supabase } from "./supabase";

export const handleRegister = async () => {
  const params = new URLSearchParams(window.location.search);
  const referrer = params.get("ref");
  const { data: options } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "generate-registration-options",
    },
  });
  const regResponse = await startRegistration({ optionsJSON: options });
  const { data: result } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "verify-registration",
      user_id: options.user.id,
      referrer,
      data: regResponse,
    },
  });
  return result;
};

export const handleLogin = async () => {
  const challenge_id = uuid();
  const { data: options } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "generate-authentication-options",
      challenge_id,
    },
  });
  const authResponse = await startAuthentication(options);
  const { data: result } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "verify-authentication",
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
  const { data } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "sign-transaction",
      data: {
        token: localStorage.getItem("token"),
        xdr,
        opts,
      },
    },
  });
  return data.signedTxXdr;
};
