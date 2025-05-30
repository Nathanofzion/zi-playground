import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { v4 as uuid } from "uuid";
import { supabase } from "./supabase";

export const handleRegister = async () => {
  const params = new URLSearchParams(window.location.search);
  const referrer = params.get("ref");
  const { data: options, error: generateError } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "generate-registration-options",
    },
  });
  if (generateError) {
    throw new Error(generateError.message);
  }
  const regResponse = await startRegistration({ optionsJSON: options });
  const { data: result, error: verifyError } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "verify-registration",
      user_id: options.user.id,
      referrer,
      data: regResponse,
    },
  });
  if (verifyError) {
    throw new Error(verifyError.message);
  }
  return result;
};

export const handleLogin = async () => {
  const challenge_id = uuid();
  const { data: options, error: generateError } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "generate-authentication-options",
      challenge_id,
    },
  });
  if (generateError) {
    throw new Error(generateError.message);
  }
  const authResponse = await startAuthentication(options);
  const { data: result, error: verifyError } = await supabase.functions.invoke("auth", {
    method: "POST",
    body: {
      action: "verify-authentication",
      challenge_id,
      data: authResponse,
    },
  });
  if (verifyError) {
    throw new Error(verifyError.message);
  }
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
  const { data, error: signError } = await supabase.functions.invoke("auth", {
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
  if (signError) {
    throw new Error(signError.message);
  }
  return data.signedTxXdr;
};
