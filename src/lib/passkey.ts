import axios from 'axios';
import { PasskeyKit } from 'passkey-kit';

import { StrKey } from '@stellar/stellar-sdk';
import { Tx } from '@stellar/stellar-sdk/contract';

import { activeChain } from './chain';

const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID;

async function send(tx: Tx) {
    return fetch('/api/send', {
        method: 'POST',
        body: JSON.stringify({
            xdr: tx.toXDR(),
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

export interface IPasskeyWallet {
    keyId_base64: string;
    publicKey: string;
}

const passkey = () => {
    const passkeyKit = new PasskeyKit({
        rpcUrl: activeChain.sorobanRpcUrl || '',
        networkPassphrase: activeChain.networkPassphrase,
        factoryContractId: FACTORY_CONTRACT_ID
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
                        console.error(err);
                        const wallet = await passkeyKit.createWallet(process.env.NEXT_PUBLIC_PROJECT_NAME!, "");
                        const contractBytes = StrKey.decodeContract(wallet.contractId);
                        const publicKey = StrKey.encodeEd25519PublicKey(contractBytes.slice(0, 32));
                        await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
                        await send(wallet.built);
                        return wallet;
                    }
                }

                const { contractId, keyId_base64 } = await connectOrCreate();
                const contractBytes = StrKey.decodeContract(contractId);
                const publicKey = StrKey.encodeEd25519PublicKey(contractBytes.slice(0, 32));
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

            const res = await passkeyKit.sign(xdr, { keyId: wallet.keyId_base64 });

            return res.toXDR();
        }
    }
}

export default passkey;
