import { NextRequest, NextResponse } from "next/server";

import { Keypair, xdr } from "@stellar/stellar-sdk";

import { contractInvoke } from "@/lib/contract";
import { accountToScVal } from "@/utils";

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;
const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;

export async function POST(req: NextRequest) {
  try {
    const { address, action } = await req.json();

    const sourceKeypair = Keypair.fromSecret(funderSecretKey);

    const result = await contractInvoke(
      airdropContractId,
      sourceKeypair,
      "distribute_tokens",
      [
        accountToScVal(sourceKeypair.publicKey()),
        accountToScVal(address),
        xdr.ScVal.scvU32(action),
      ]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 500 });
  }
}
