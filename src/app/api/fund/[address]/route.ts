import { NextRequest, NextResponse } from "next/server";

import { Keypair, nativeToScVal } from "@stellar/stellar-sdk";

import nativeToken from "@/constants/nativeToken";
import { contractInvoke } from "@/lib/contract";
import { accountToScVal } from "@/utils";

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function GET(
  _: NextRequest,
  { params: { address } }: { params: { address: string } }
) {
  try {
    const sourceKeypair = Keypair.fromSecret(funderSecretKey);

    const result = await contractInvoke(
      nativeToken.contract,
      sourceKeypair,
      "transfer",
      [
        accountToScVal(sourceKeypair.publicKey()),
        accountToScVal(address),
        nativeToScVal(10 * 1e7, { type: "i128" }),
      ]
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
