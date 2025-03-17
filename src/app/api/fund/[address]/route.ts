import { NextRequest, NextResponse } from "next/server";

import {
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

import nativeToken from "@/constants/nativeToken";
import { activeChain } from "@/lib/chain";
import { accountToScVal } from "@/utils";

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function GET(
  _: NextRequest,
  { params: { address } }: { params: { address: string } }
) {
  try {
    const sourceKeypair = Keypair.fromSecret(funderSecretKey);

    const server = new Server(activeChain.sorobanRpcUrl!);

    const contract = new Contract(nativeToken.contract);
    const transaction = new TransactionBuilder(
      await server.getAccount(sourceKeypair.publicKey()),
      {
        fee: BASE_FEE,
        networkPassphrase: activeChain.networkPassphrase,
      }
    );

    const tx = transaction
      .addOperation(
        contract.call(
          "transfer",
          accountToScVal(sourceKeypair.publicKey()),
          accountToScVal(address),
          nativeToScVal(10 * 1e7, { type: "i128" })
        )
      )
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

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 500 });
  }
}
