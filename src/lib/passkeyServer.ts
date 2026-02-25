import { PasskeyServer } from 'passkey-kit';

import { activeChain } from './chain';

const rpcUrl = activeChain.sorobanRpcUrl!;
const mercuryProjectName = process.env.MERCURY_PROJECT_NAME!;
const mercuryUrl = process.env.MERCURY_URL!;
const mercuryJwt = process.env.MERCURY_JWT!;

export const server = new PasskeyServer({
    rpcUrl,
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
    relayerApiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
    mercuryProjectName,
    mercuryUrl,
    mercuryJwt,
});
