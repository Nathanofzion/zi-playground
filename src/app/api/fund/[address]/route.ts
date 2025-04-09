import { NextRequest, NextResponse } from "next/server";

import { nativeToScVal } from "@stellar/stellar-sdk";

import nativeToken from "@/constants/nativeToken";
import { contractInvoke } from "@/lib/contract";
import { accountToScVal } from "@/utils";

const funderPublicKey = process.env.FUNDER_PUBLIC_KEY!;
const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function GET(
  _: NextRequest,
  { params: { address } }: { params: { address: string } }
) {
  try {
    const result = await contractInvoke({
      contractAddress: nativeToken.contract,
      secretKey: funderSecretKey,
      method: "transfer",
      args: [
        accountToScVal(funderPublicKey),
        accountToScVal(address),
        nativeToScVal(10 * 1e7, { type: "i128" }),
      ],
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
