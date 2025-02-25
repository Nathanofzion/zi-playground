import { PasskeyServer } from 'passkey-kit';

import { activeChain } from './chain';

const rpcUrl = activeChain.sorobanRpcUrl!;
const launchtubeUrl = process.env.NEXT_PUBLIC_LAUNCHTUBE_URL!;
const launchtubeJwt = process.env.LAUNCHTUBE_JWT!;
const mercuryProjectName = process.env.NEXT_PUBLIC_PROJECT_NAME!;
const mercuryUrl = process.env.NEXT_PUBLIC_MERCURY_URL!;
const mercuryKey = process.env.MERCURY_KEY!;

export const server = new PasskeyServer({
    rpcUrl,
    launchtubeUrl,
    launchtubeJwt,
    mercuryProjectName,
    mercuryUrl,
    mercuryKey,
});
