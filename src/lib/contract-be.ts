import {
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server } from "@stellar/stellar-sdk/rpc";
import { activeChain } from "./chain";

const server = new Server(activeChain.sorobanRpcUrl!);

export type InvokeArgs = {
  contractAddress: string;
  method: string;
  args?: xdr.ScVal[] | undefined;
  secretKey: string;
};

export const contractInvoke = async ({
  contractAddress,
  method,
  args,
  secretKey,
}: InvokeArgs) => {
  const sourceKeypair = Keypair.fromSecret(secretKey);

  if (!sourceKeypair) throw new Error("Invalid signature!");

  const address = sourceKeypair.publicKey();
  const account = await server.getAccount(address);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: activeChain.networkPassphrase,
  });

  const contract = new Contract(contractAddress);

  const tx = transaction
    .addOperation(contract.call(method, ...(args ?? [])))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sourceKeypair);

  const sendTransactionResponse = await server.sendTransaction(preparedTx);

  let waitTime = 1000;
  const exponentialFactor = 1.5;

  do {
    const getTransactionResponse = await server.getTransaction(
      sendTransactionResponse.hash
    );
    if (getTransactionResponse.status != Api.GetTransactionStatus.NOT_FOUND) {
      return getTransactionResponse;
    }
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    waitTime = waitTime * exponentialFactor;
  } while (true);
};
