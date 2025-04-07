import { PasskeyServer } from 'passkey-kit';

import { activeChain } from './chain';

const rpcUrl = activeChain.sorobanRpcUrl!;
const launchtubeUrl = process.env.LAUNCHTUBE_URL!;
const launchtubeJwt = process.env.LAUNCHTUBE_JWT!;
const mercuryProjectName = process.env.MERCURY_PROJECT_NAME!;
const mercuryUrl = process.env.MERCURY_URL!;
const mercuryJwt = process.env.MERCURY_JWT!;

export const server = new PasskeyServer({
    rpcUrl,
    launchtubeUrl,
    launchtubeJwt,
    mercuryProjectName,
    mercuryUrl,
    mercuryJwt,
});
