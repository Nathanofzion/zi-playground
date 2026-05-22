import { NextRequest, NextResponse } from "next/server";

import { Address, nativeToScVal } from "@stellar/stellar-sdk-v14";

import nativeToken from "@/constants/nativeToken";
import { contractInvoke } from "@/lib/contract";

const funderPublicKey = process.env.FUNDER_PUBLIC_KEY!;
const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

// Testnet-only XLM funder — no JWT auth required (testnet has no real value).
// Protected by server-side FUNDER_SECRET_KEY only being available server-side.
export async function GET(
  req: NextRequest,
  { params: { address } }: { params: { address: string } }
) {
  // Basic address validation — must be a 56-char C-address (smart contract)
  if (!address || !address.startsWith("C") || address.length !== 56) {
    return NextResponse.json({ error: "Invalid contract address" }, { status: 400 });
  }

  if (!funderSecretKey || !funderPublicKey) {
    console.error("[fund] FUNDER_SECRET_KEY or FUNDER_PUBLIC_KEY not set");
    return NextResponse.json({ error: "Funder not configured" }, { status: 500 });
  }

  try {
    console.log(`[fund] Funding ${address.substring(0, 8)}... with 10 XLM`);
    const fromScVal = new Address(funderPublicKey).toScVal();
    const toScVal = new Address(address).toScVal();

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

    console.log(`[fund] Funded ${address.substring(0, 8)}... successfully`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[fund] Failed to fund ${address.substring(0, 8)}...:`, error?.message ?? error);
    return NextResponse.json(
      { error: "Funding failed", message: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
