import { InvokeArgs, sendTx, SignAndSendArgs, Tx } from "@soroban-react/contracts";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
import { send } from "./passkeyClient";

const defaultAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

async function signAndSendTransaction({
    txn,
    secretKey,
    skipAddingFootprint = false,
    sorobanContext,
    timeoutSeconds = 20,
}: SignAndSendArgs) {
    const { activeChain, activeConnector } = sorobanContext;
    let networkPassphrase = activeChain!.networkPassphrase;
    let server = sorobanContext.server;
    if (!secretKey && !activeConnector)
        throw Error('signAndSend: no secretKey neither activeConnector');
    if (!server)
        throw Error('signAndSend: no server');
    if (!networkPassphrase)
        throw Error('signAndSend: no networkPassphrase');
    // preflight and add the footprint !
    if (!skipAddingFootprint) {
        txn = await server.prepareTransaction(txn);
        if (!txn) {
            throw new Error('No transaction after adding footprint');
        }
    }
    let signed = '';
    if (secretKey) {
        const keypair = StellarSdk.Keypair.fromSecret(secretKey);
        txn.sign(keypair);
        signed = txn.toXDR();
    }
    else if (activeConnector) {
        console.log('TRANSACTION SIGN AND SEND OPTS', {
            networkPassphrase,
            network: activeChain!.id,
            accountToSign: sorobanContext.address,
        });
        signed = await activeConnector.signTransaction(txn.toXDR(), {
            networkPassphrase,
            network: activeChain!.id,
            accountToSign: sorobanContext.address,
        });
        console.log('Wallet has signed: ', signed);
    }
    else {
        throw new Error('signAndSendTransaction: no secretKey, neither active Connector');
    }
    if (!secretKey && activeConnector!.id == 'passkey') {
        return send(signed);
    } else {
        const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(signed, networkPassphrase);
        let tx = transactionToSubmit;
        let secondsToWait = timeoutSeconds;
        const raw = await sendTx({ tx: tx as Tx, secondsToWait, server });
        return raw;
    }
}

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
        throw new Error('No active Chain');
    }
    if (!server) {
        throw new Error('No connected to a Server');
    }
    if (signAndSend && !secretKey && !activeConnector) {
        throw new Error('contractInvoke: You are trying to sign a txn without providing a source, secretKey or active connector');
    }
    const networkPassphrase = activeChain.networkPassphrase!;
    let source = null;
    if (secretKey) {
        source = await server.getAccount(StellarSdk.Keypair.fromSecret(secretKey).publicKey());
    }
    else {
        try {
            if (!address)
                throw new Error('No address');
            source = await server.getAccount(address);
        }
        catch (error) {
            source = new StellarSdk.Account(defaultAddress, '0');
        }
    }

    const contract = new StellarSdk.Contract(contractAddress);
    //Builds the transaction
    let tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100',
        networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(StellarSdk.TimeoutInfinite);
    if (memo)
        tx = tx.addMemo(StellarSdk.Memo.text(memo));
    let txn = tx.build();

    const simulated = await server.simulateTransaction(txn);
    if (Api.isSimulationError(simulated)) {
        throw new Error(simulated.error);
    }
    else if (!simulated.result) {
        throw new Error(`invalid simulation: no result in ${simulated}`);
    }
    if (!signAndSend && simulated) {
        return simulated.result.retval;
    }
    else {
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
