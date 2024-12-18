import { SorobanRpc } from '@stellar/stellar-sdk';
import { PasskeyKit, SACClient } from 'passkey-kit';

const PUBLIC_STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
const PUBLIC_STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const PUBLIC_FACTORY_CONTRACT_ADDRESS = "CCPLERXCJZB7LX2VOSOCBNRN754FRLHI6Y2AVOQBA5L7C2ZJX5RFVVET";
const PUBLIC_NATIVE_CONTRACT_ADDRESS = "CCPLERXCJZB7LX2VOSOCBNRN754FRLHI6Y2AVOQBA5L7C2ZJX5RFVVET";

export const rpc = new SorobanRpc.Server(PUBLIC_STELLAR_RPC_URL);

export const account = new PasskeyKit({
    rpcUrl: PUBLIC_STELLAR_RPC_URL,
    networkPassphrase: PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    factoryContractId: PUBLIC_FACTORY_CONTRACT_ADDRESS,
});

export const sac = new SACClient({
    rpcUrl: PUBLIC_STELLAR_RPC_URL,
    networkPassphrase: PUBLIC_STELLAR_NETWORK_PASSPHRASE,
});

export const native = sac.getSACClient(PUBLIC_NATIVE_CONTRACT_ADDRESS);

export async function send(xdr: string) {
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

export async function getContractId(signer: string) {
    return fetch(`/api/contract-id/${signer}`).then(async (res) => {
        if (res.ok) return res.text();
        else throw await res.text();
    });
}

export async function fundContract(address: string) {
    return fetch(`/api/fund/${address}`).then(async (res) => {
        if (res.ok) return res.json();
        else throw await res.text();
    });
}
