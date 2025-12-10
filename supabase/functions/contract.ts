import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  scValToNative,
  Transaction,
  TransactionBuilder,
  xdr,
} from "npm:@stellar/stellar-sdk";

import { Api, Server } from "npm:@stellar/stellar-sdk/rpc";

const sorobanRpcUrl = Deno.env.get("SOROBAN_RPC_URL")!;
const networkPassphrase = Deno.env.get("NETWORK_PASSPHRASE");

export const server = new Server(sorobanRpcUrl);

const defaultAddress =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export async function sendTx(tx: Transaction) {
  const sendTransactionResponse = await server.sendTransaction(tx);

  let waitTime = 1000;
  const exponentialFactor = 1.5;
  const maxAttempts = 12; // ~> bounded polling to avoid infinite loops
  const started = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const getTransactionResponse = await server.getTransaction(
      sendTransactionResponse.hash
    );
    if (getTransactionResponse.status != Api.GetTransactionStatus.NOT_FOUND) {
      return getTransactionResponse;
    }
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    waitTime = waitTime * exponentialFactor;
    // safety: hard timeout ~60s
    if (Date.now() - started > 60_000) {
      throw new Error(
        `Transaction polling timed out after ${attempt + 1} attempts (~${(
          (Date.now() - started) / 1000
        ).toFixed(1)}s)`
      );
    }
  }

  throw new Error(
    `Transaction not found after ${maxAttempts} attempts (~${(
      (Date.now() - started) / 1000
    ).toFixed(1)}s)`
  );
}

export type InvokeArgs = {
  contractAddress: string;
  method: string;
  args?: xdr.ScVal[] | undefined;
  secretKey?: string;
};

export const simulateTransaction = async ({
  contractAddress,
  method,
  args,
}: InvokeArgs) => {
  const account = new Account(defaultAddress, "0");

  const contract = new Contract(contractAddress!);

  const txn = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...(args ?? [])))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(txn);

  if (Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  if (!simulated.result) {
    throw new Error(`invalid simulation: no result in ${simulated}`);
  }

  return scValToNative(simulated.result.retval);
};

export const contractInvoke = async ({
  contractAddress,
  method,
  args,
  secretKey,
}: InvokeArgs) => {
  if (!secretKey) throw new Error("Secret key is required!");

  const sourceKeypair = Keypair.fromSecret(secretKey);

  if (!sourceKeypair) throw new Error("Invalid signature!");

  const address = sourceKeypair.publicKey();
  const account = await server.getAccount(address);

  const contract = new Contract(contractAddress!);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args!))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sourceKeypair);

  return sendTx(preparedTx);
};
