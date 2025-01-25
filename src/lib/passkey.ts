import { StrKey } from '@stellar/stellar-sdk';
import axios from 'axios';
import { PasskeyKit } from 'passkey-kit';

const STELLAR_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL;
const STELLAR_NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE;
const FACTORY_CONTRACT_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID;

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
        iconUrl: '/images/passkey.png',
        iconBackground: '',
        installed: true,

        isConnected: async () => true,

        getNetworkDetails: async () => {
            return {
                network: 'TESTNET',
                networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
                networkUrl: STELLAR_RPC_URL
            };
        },

        getPublicKey: async () => {
            if (!connected || !publicKey) {
                const wallet = await passkeyKit.createWallet("Zi Airdrop Playground", "");
                const contractBytes = StrKey.decodeContract(wallet.contractId);
                connected = true;
                publicKey = StrKey.encodeEd25519PublicKey(contractBytes.slice(0, 32));
                await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
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

            const res = await passkeyKit.sign(xdr);

            if (res) return 'success';
            else return 'error';
        }
    }
}

export default passkey;
