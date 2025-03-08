import { PasskeyKit, SACClient } from "passkey-kit";

import nativeToken from "@/constants/nativeToken";
import axios from "axios";
import { activeChain } from "./chain";

const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME!;
const walletWasmHash = process.env.NEXT_PUBLIC_WALLET_WASM_HASH!;

export interface IPasskeyWallet {
  contractId: string;
  keyIdBase64: string;
}

function send(xdr: string) {
  return axios.post("/api/send", { xdr });
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

export const sac = new SACClient({
  rpcUrl: activeChain.sorobanRpcUrl!,
  networkPassphrase: activeChain.networkPassphrase,
});

export const native = sac.getSACClient(nativeToken.contract);

export const passkeyKit = new PasskeyKit({
  rpcUrl: activeChain.sorobanRpcUrl!,
  networkPassphrase: activeChain.networkPassphrase,
  walletWasmHash: walletWasmHash,
});

const passkey = () => ({
  id: "passkey",
  name: "PasskeyID",
  shortName: "Passkey",
  iconUrl: "/images/passkey.png",
  iconBackground: "",
  installed: true,

  isConnected: async () => true,

  getNetworkDetails: async () => activeChain,

  getPublicKey: async () => {
    const connectOrCreate = async () => {
      try {
        return await passkeyKit.connectWallet({
          getContractId,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        const wallet = await passkeyKit.createWallet(projectName, "");
        await send(wallet.signedTx.toXDR());
        await fundContract(wallet.contractId);
        return wallet;
      }
    };

    const { contractId } = await connectOrCreate();
    return contractId;
  },

  signTransaction: async (
    xdr: string,
    _opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ) => {
    const _xdr = await passkeyKit.sign(xdr);

    const response = await send(_xdr.toXDR());

    throw new Error(JSON.stringify(response));
  },
});

export default passkey;
