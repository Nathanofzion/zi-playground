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
  // NOTE: Soroban transactions (Protocol 23+) do NOT support memos
  // Adding a memo to a Soroban transaction will cause: "non-source auth Soroban tx uses memo or mixed source account"
  let tx = new StellarSdk.TransactionBuilder(source, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(StellarSdk.TimeoutInfinite);
  // Do NOT add memo to Soroban transactions - Protocol 23 prohibits it
  const txn = tx.build();

  const simulated = await server.simulateTransaction(txn);
  if (Api.isSimulationError(simulated)) {
    console.error('❌ Simulation error:', simulated.error);
    throw new Error(simulated.error);
  } else if (!simulated.result) {
    console.error('❌ Simulation returned no result:', simulated);
    throw new Error(`invalid simulation: no result in ${simulated}`);
  }
  
  console.log('✅ Simulation successful:', {
    cost: simulated.result.cost,
    hasRetval: !!simulated.result.retval,
    hasEvents: !!simulated.result.events
  });
  
  if (!signAndSend && simulated) {
    return simulated.result.retval;
  } else {
    // If signAndSend
    console.log('📝 Signing and sending transaction...');
    try {
      const res = await signAndSendTransaction({
        txn,
        skipAddingFootprint,
        secretKey,
        sorobanContext,
        timeoutSeconds,
      });

      console.log('✅ Transaction signed and sent:', {
        hasHash: !!res?.hash,
        hasResponse: !!res,
        responseType: typeof res
      });

      if (reconnectAfterTx) {
        sorobanContext.connect();
      }
      return res;
    } catch (error: any) {
      console.error('❌ Transaction signing/sending failed:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      throw error;
    }
  }
}
