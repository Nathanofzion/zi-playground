import {
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server } from "@stellar/stellar-sdk/rpc";
import { activeChain } from "./chain";
import { SorobanRpc , Transaction , sign} from "@stellar/stellar-sdk";

export const server = new Server(activeChain.sorobanRpcUrl!);

export async function sendTx(tx: Transaction) {
  const sendTransactionResponse = await server.sendTransaction(tx);

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
}

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

  const contract = new Contract(contractAddress!);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: activeChain.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args!))
    .setTimeout(30)
    .build();

    // const simulated = await server.simulateTransaction(tx);

    // console.log("Full simulation response:", JSON.stringify(simulated, null, 2));
    // console.log("Simulation status:", (simulated as any).status);
    // console.log("Simulation results:", (simulated as any).results);
    // console.log("Simulation transactionData:", (simulated as any).transactionData);

    // if ((simulated as any).error) {
    //   throw new Error((simulated as any).error);
    // }

    // Try One
    // // ✅ Assemble tx using simulation result
    // const assembledTx = SorobanRpc.assembleTransaction(tx, simulated);

    // // 🔑 THIS IS THE MISSING STEP
    // // const assembledTx = assembledBuilder.build();    

    // // ✅ Sign
    // (assembledTx as any).sign(sourceKeypair);

    // // ✅ Send + wait
    // return await sendTx(assembledTx as any);
    // Try One

    // ✅ Assemble returns TransactionBuilder
    //  const assembledTxBuilder = SorobanRpc.assembleTransaction(tx, simulated);
     
    //   console.log("Assembled Transaction : ",assembledTxBuilder);
      

    //  // ✅ Build to get Transaction
    //  const assembledTx = assembledTxBuilder.build();
    //  // ✅ Sign using the Transaction's sign method
    //  assembledTx.sign(sourceKeypair);
    //  // ✅ Send + wait
    //   return await sendTx(assembledTx);
    

  // const preparedTx = await server.prepareTransaction(tx);
  // console.log("Prepared TX : ",preparedTx);
  
  // preparedTx.sign(sourceKeypair);

  // return sendTx(preparedTx);

   try {
    const preparedTx = await server.prepareTransaction(tx);
    
    console.log("Prepared TX type:", preparedTx.constructor.name);
    console.log("Has sign method:", typeof preparedTx.sign);
    console.log("Envelope type:", (preparedTx as any)._envelopeType);
    
    // Try to inspect the transaction structure
    console.log("TX structure:", {
      fee: (preparedTx as any)._fee,
      source: (preparedTx as any)._source,
      operations: (preparedTx as any)._operations?.length,
      networkPassphrase: (preparedTx as any)._networkPassphrase
    });

    // ✅ Try signing with error handling
    try {
      preparedTx.sign(sourceKeypair);
      console.log("✅ Signing successful");
    } catch (signError) {
      console.error("❌ Signing failed:", signError);
      console.error("Sign error stack:", (signError as Error).stack);
      
      // Try alternative: convert to XDR and back
      console.log("Attempting XDR workaround...");
      const txXdr = preparedTx.toXDR();
      console.log("TX XDR:", txXdr);
      
      const rebuiltTx = new Transaction(txXdr, activeChain.networkPassphrase);
      rebuiltTx.sign(sourceKeypair);
      return await sendTx(rebuiltTx);
    }

    return await sendTx(preparedTx);
  }catch(error){
    console.log("Error : ",error);
    
  }
    
};
