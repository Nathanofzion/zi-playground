import axios from "axios";
import { PasskeyKit } from "passkey-kit";

import { TxResponse } from "@soroban-react/contracts";

import { activeChain } from "./chain";
import { handleRegister } from "./passkey";

const walletWasmHash = process.env.NEXT_PUBLIC_WALLET_WASM_HASH!;

export const passkeyKit = new PasskeyKit({
  rpcUrl: activeChain.sorobanRpcUrl!,
  networkPassphrase: activeChain.networkPassphrase,
  walletWasmHash: walletWasmHash,
});

export interface IPasskeyWallet {
  contractId: string;
  keyIdBase64: string;
}

export async function send(xdr: string) {
  const { data } = await axios.post<TxResponse>("/api/send", {
    xdr,
  });
  return data;
}

async function getContractId(signer: string) {
  const { data } = await axios.get<{ contractId: string }>(
    `/api/contract/${signer}`
  );
  return data.contractId;
}

function fundContract(address: string) {
  return axios.get(`/api/fund/${address}`);
}

export async function getSigners(contractId: string) {
  const { data } = await axios.get(`/api/signer/${contractId}`);
  return data;
}

const passkey = () => {
  return {
    id: "passkey",
    name: "PasskeyID",
    shortName: "Passkey",
    iconUrl: "/images/passkey.png",
    iconBackground: "",
    installed: true,

    isConnected: async () => true,

    getNetworkDetails: async () => activeChain,

    getPublicKey: async () => {
      await handleRegister();
      return "";
    },

    signTransaction: async (
      xdr: string,
      _opts?: {
        network?: string;
        networkPassphrase?: string;
        accountToSign?: string;
      }
    ) => {
      const signedTx = await passkeyKit.sign(xdr);
      return signedTx.toXDR();
    },
  };
};

export default passkey;
