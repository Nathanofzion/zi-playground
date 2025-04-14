import { InvokeArgs, signAndSendTransaction } from "@soroban-react/contracts";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";

const defaultAddress =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export async function contractInvoke({
  contractAddress,
  method,
  args = [],
  memo,
  signAndSend = false,
  fee = 100,
  skipAddingFootprint,
  secretKey,
  sorobanContext,
  reconnectAfterTx = true,
  timeoutSeconds = 20,
}: InvokeArgs & { memo?: string }) {
  const { server, address, activeChain, activeConnector } = sorobanContext;
  if (!activeChain) {
    throw new Error("No active Chain");
  }
  if (!server) {
    throw new Error("No connected to a Server");
  }
  if (signAndSend && !secretKey && !activeConnector) {
    throw new Error(
      "contractInvoke: You are trying to sign a txn without providing a source, secretKey or active connector"
    );
  }
  const networkPassphrase = activeChain.networkPassphrase!;
  let source = null;
  if (secretKey) {
    source = await server.getAccount(
      StellarSdk.Keypair.fromSecret(secretKey).publicKey()
    );
  } else {
    try {
      if (!address) throw new Error("No address");
      source = await server.getAccount(address);
    } catch (error) {
      source = new StellarSdk.Account(defaultAddress, "0");
    }
  }

  const contract = new StellarSdk.Contract(contractAddress);
  //Builds the transaction
  let tx = new StellarSdk.TransactionBuilder(source, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(StellarSdk.TimeoutInfinite);
  if (memo) tx = tx.addMemo(StellarSdk.Memo.text(memo));
  const txn = tx.build();

  const simulated = await server.simulateTransaction(txn);
  if (Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  } else if (!simulated.result) {
    throw new Error(`invalid simulation: no result in ${simulated}`);
  }
  if (!signAndSend && simulated) {
    return simulated.result.retval;
  } else {
    // If signAndSend
    const res = await signAndSendTransaction({
      txn,
      skipAddingFootprint,
      secretKey,
      sorobanContext,
      timeoutSeconds,
    });

    if (reconnectAfterTx) {
      sorobanContext.connect();
    }
    return res;
  }
}
