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
      const username = localStorage.getItem("username");

      if (!username) {
        throw new Error("Please input user name");
      }

      const connectOrCreate = async () => {
        try {
          const wallet = await handleLogin(username);
          return wallet;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          const wallet = await handleRegister(username);
          return wallet;
        }
      };

      const wallet = await connectOrCreate();
      localStorage.setItem("token", wallet.token);
      return wallet.publicKey;
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
