import {
  Account,
  BASE_FEE,
  Contract,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "npm:@stellar/stellar-sdk";
import { Api, Server } from "npm:@stellar/stellar-sdk/rpc";

const sorobanRpcUrl = Deno.env.get("SOROBAN_RPC_URL")!;
const networkPassphrase = Deno.env.get("NETWORK_PASSPHRASE");

export const server = new Server(sorobanRpcUrl);

const defaultAddress =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export type InvokeArgs = {
  contractAddress: string;
  method: string;
  args?: xdr.ScVal[] | undefined;
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
