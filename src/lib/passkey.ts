import { StrKey } from '@stellar/stellar-sdk';
import axios from 'axios';
import { PasskeyKit } from 'passkey-kit';

import { activeChain } from './chain';

const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID;

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
                        return await passkeyKit.connectWallet();
                    } catch (err) {
                        console.error(err);
                        const wallet = await passkeyKit.createWallet("Zi Airdrop Playground", "");
                        const contractBytes = StrKey.decodeContract(wallet.contractId);
                        const publicKey = StrKey.encodeEd25519PublicKey(contractBytes.slice(0, 32));
                        await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
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
