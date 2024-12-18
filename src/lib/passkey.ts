import { StrKey } from '@stellar/stellar-sdk';
import { PasskeyKit } from 'passkey-kit';

import passkeyImage from '/img/img/passkey.png';

const STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const FACTORY_CONTRACT_ID = "CAUN2AYT2VHF362EO7BFB6FM763F4F3AKRNTNOVLI4HC6LFGQFYQ6CB6";

const passkey = () => {
    const passkeyKit = new PasskeyKit({
        rpcUrl: STELLAR_RPC_URL,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        factoryContractId: FACTORY_CONTRACT_ID
    });

    let connected = false;
    let publicKey: string | null = null;

    return {
        id: 'passkey',
        name: "PasskeyID",
        shortName: "Passkey",
        iconUrl: passkeyImage,
        iconBackground: '',
        installed: true,

        isConnected: async () => connected,

        getNetworkDetails: async () => {
            return {
                network: 'TESTNET',
                networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
                networkUrl: STELLAR_RPC_URL
            };
        },

        getPublicKey: async () => {
            if (!connected || !publicKey) {
                const wallet = await passkeyKit.connectWallet();
                const contractBytes = StrKey.decodeContract(wallet.contractId);
                connected = true;
                publicKey = StrKey.encodeEd25519PublicKey(contractBytes.slice(0, 32));
            }
            return publicKey;
        },

        signTransaction: async (xdr: string, _opts?: {
            network?: string;
            networkPassphrase?: string;
            accountToSign?: string;
        }) => {
            if (!connected)
                throw new Error('Not connected');

            const result = await passkeyKit.sign(xdr);
            return result;
        }
    }
}

export default passkey;
