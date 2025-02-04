import { PasskeyServer } from 'passkey-kit';

const { LAUNCHTUBE_JWT, MERCURY_KEY } = process.env;
const { NEXT_PUBLIC_PROJECT_NAME, NEXT_PUBLIC_LAUNCHTUBE_URL, NEXT_PUBLIC_MERCURY_URL, NEXT_PUBLIC_STELLAR_RPC_URL } = process.env;

export const server = new PasskeyServer({
    rpcUrl: NEXT_PUBLIC_STELLAR_RPC_URL,
    launchtubeUrl: NEXT_PUBLIC_LAUNCHTUBE_URL,
    launchtubeJwt: LAUNCHTUBE_JWT,
    mercuryProjectName: NEXT_PUBLIC_PROJECT_NAME,
    mercuryUrl: NEXT_PUBLIC_MERCURY_URL,
    mercuryKey: MERCURY_KEY,
});
