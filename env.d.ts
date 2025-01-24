declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_STELLAR_RPC_URL: string;
        NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: string;
        NEXT_PUBLIC_FACTORY_CONTRACT_ID: string;
        NEXT_PUBLIC_AIRDROP_CONTRACT_ID: string;
    }
}