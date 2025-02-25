import { PasskeyKit, SACClient } from 'passkey-kit';

import { activeChain, nativeTokenAddress } from './chain';

const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME!;
const factoryContractId = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID;

export interface IPasskeyWallet {
  keyId_base64: string;
  publicKey: string;
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

export const native = sac.getSACClient(nativeTokenAddress);

const passkey = () => {
  const passkeyKit = new PasskeyKit({
    rpcUrl: activeChain.sorobanRpcUrl!,
    networkPassphrase: activeChain.networkPassphrase,
    factoryContractId,
  });

  let wallet: IPasskeyWallet | null = null;

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
      if (!wallet) {
        const connectOrCreate = async () => {
          try {
            return await passkeyKit.connectWallet({
              getContractId,
            });
          } catch (err) {
            const wallet = await passkeyKit.createWallet(projectName, "");
            const publicKey = wallet.contractId;
            await send(wallet.built.toXDR());
            await fundContract(publicKey);
            return wallet;
          }
        }

        const { contractId, keyId_base64 } = await connectOrCreate();
        const publicKey = contractId;
        wallet = { keyId_base64, publicKey };
        return publicKey;
      }
      return wallet.publicKey;
    },

    signTransaction: async (xdr: string, _opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }) => {
      if (!wallet)
        throw new Error('Not connected');

      const _xdr = await passkeyKit.sign(xdr);

      const response = await send(_xdr.toXDR());

      throw new Error(response);
    }
  }
}

export default passkey;
