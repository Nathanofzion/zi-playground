import { PasskeyKit, SACClient } from 'passkey-kit';

import nativeToken from '@/constants/nativeToken';
import { activeChain } from './chain';

const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME!;
const walletWasmHash = process.env.NEXT_PUBLIC_WALLET_WASM_HASH!;

export interface IPasskeyWallet {
  contractId: string;
  keyIdBase64: string;
}

async function send(xdr: string) {
  return fetch('/api/send', {
    method: 'POST',
    body: JSON.stringify({
      xdr,
    }),
  }).then(async (res) => {
    if (res.ok) return res.json();
    else throw await res.text();
  });
}

async function getContractId(signer: string) {
  return fetch(`/api/contract/${signer}`).then(async (res) => {
    if (res.ok) return res.text();
    else throw await res.text();
  });
}

async function fundContract(address: string) {
  return fetch(`/api/fund/${address}`).then(async (res) => {
    if (res.ok) return res.json();
    else throw await res.text();
  });
}

export const sac = new SACClient({
  rpcUrl: activeChain.sorobanRpcUrl!,
  networkPassphrase: activeChain.networkPassphrase,
});

export const native = sac.getSACClient(nativeToken.contract);

const passkey = () => {
  const passkeyKit = new PasskeyKit({
    rpcUrl: activeChain.sorobanRpcUrl!,
    networkPassphrase: activeChain.networkPassphrase,
    walletWasmHash: walletWasmHash,
  });

  return {
    id: 'passkey',
    name: "PasskeyID",
    shortName: "Passkey",
    iconUrl: '/images/passkey.png',
    iconBackground: '',
    installed: true,

    isConnected: async () => true,

    getNetworkDetails: async () => activeChain,

    getPublicKey: async () => {
      const connectOrCreate = async () => {
        try {
          return await passkeyKit.connectWallet({
            getContractId,
          });
        } catch (err) {
          const wallet = await passkeyKit.createWallet(projectName, "");
          await send(wallet.signedTx.toXDR());
          await fundContract(wallet.contractId);
          return wallet;
        }
      }

      const { contractId } = await connectOrCreate();
      return contractId;
    },

    signTransaction: async (xdr: string, _opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }) => {
      const _xdr = await passkeyKit.sign(xdr);

      const response = await send(_xdr.toXDR());

      throw new Error(JSON.stringify(response));
    }
  }
}

export default passkey;
