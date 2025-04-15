import { activeChain } from "./chain";
import { handleLogin, handleRegister, handleSign } from "./passkey";

const passkey = () => {
  return {
    id: "passkey",
    name: "PasskeyID",
    shortName: "Passkey",
    iconUrl: "/images/passkey.png",
    iconBackground: "",
    installed: true,

    isConnected: async () => true,

    getNetworkDetails: async () => activeChain,

    getPublicKey: async () => {
      const connectOrCreate = async () => {
        try {
          return await handleLogin();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          return await handleRegister();
        }
      };

      const { token, publicKey } = await connectOrCreate();
      localStorage.setItem("token", token);
      return publicKey;
    },

    signTransaction: async (
      xdr: string,
      opts?: {
        network?: string;
        networkPassphrase?: string;
        accountToSign?: string;
      }
    ) => {
      return await handleSign(xdr, opts);
    },
  };
};

export default passkey;
