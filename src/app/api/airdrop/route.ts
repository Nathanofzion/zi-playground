import { NextRequest, NextResponse } from "next/server";

import {
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

import zionToken from "@/constants/zionToken";
import { activeChain } from "@/lib/chain";
import { accountToScVal } from "@/utils";

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;
const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

export async function POST(req: NextRequest) {
  try {
    const { address, action } = await req.json();

    const sourceKeypair = Keypair.fromSecret(funderSecretKey);

    const server = new Server(activeChain.sorobanRpcUrl!);

    const contract = new Contract(airdropContractId);
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
          "distribute_tokens",
          accountToScVal(sourceKeypair.publicKey()),
          accountToScVal(address),
          accountToScVal(zionToken.contract),
          xdr.ScVal.scvU32(action)
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
    return NextResponse.json(error, { status: 500 });
  }
}
