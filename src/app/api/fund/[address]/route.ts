import { NextRequest, NextResponse } from "next/server";

import { nativeToScVal } from "@stellar/stellar-sdk";

import nativeToken from "@/constants/nativeToken";
import { contractInvoke } from "@/lib/contract";
import { accountToScVal } from "@/utils";
import { requireAuth, isAuthError } from "@/lib/api-auth";

const funderPublicKey = process.env.FUNDER_PUBLIC_KEY!;
const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function GET(
  req: NextRequest,
  { params: { address } }: { params: { address: string } }
) {
  // P02: Require authenticated user
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const [fromScVal, toScVal] = await Promise.all([
      accountToScVal(funderPublicKey),
      accountToScVal(address),
    ]);
    const result: any = await contractInvoke({
      contractAddress: nativeToken.contract,
      secretKey: funderSecretKey,
      method: "transfer",
      args: [
        fromScVal,
        toScVal,
        nativeToScVal(10 * 1e7, { type: "i128" }),
      ],
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
