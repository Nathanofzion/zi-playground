import {
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

import { activeChain } from "./chain";

const server = new Server(activeChain.sorobanRpcUrl!);

export const contractInvoke = async (
  contractId: string,
  sourceKeypair: Keypair,
  method: string,
  params: xdr.ScVal[]
) => {
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(
    await server.getAccount(sourceKeypair.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: activeChain.networkPassphrase,
    }
  );

  const tx = transaction
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sourceKeypair);

  const result = await server.sendTransaction(preparedTx);

  let response = await server.getTransaction(result.hash);
  while (response.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    response = await server.getTransaction(result.hash);
  }

  return response;
};
