import { NextRequest, NextResponse } from "next/server";

import { xdr } from "@stellar/stellar-sdk";

import { contractInvoke } from "@/lib/contract";
import { accountToScVal } from "@/utils";

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID!;
const funderPublicKey = process.env.FUNDER_PUBLIC_KEY!;
const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { address, action } = await req.json();

    const result = await contractInvoke({
      contractAddress: airdropContractId,
      secretKey: funderSecretKey,
      method: "distribute_tokens",
      args: [
        accountToScVal(funderPublicKey),
        accountToScVal(address),
        xdr.ScVal.scvU32(action),
      ],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 500 });
  }
}
