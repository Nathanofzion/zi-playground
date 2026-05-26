import { NextRequest, NextResponse } from "next/server";

import { Address, Keypair, nativeToScVal } from "@stellar/stellar-sdk-v14";

import nativeToken from "@/constants/nativeToken";
import { contractInvoke } from "@/lib/contract";

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;
const FUND_AMOUNTS_XLM = [10000, 1000, 100, 10, 1] as const;

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

  if (!funderSecretKey) {
    console.error("[fund] FUNDER_SECRET_KEY not set");
    return NextResponse.json({ error: "Funder not configured" }, { status: 500 });
  }

  // Derive public key from secret key — avoids any FUNDER_PUBLIC_KEY mismatch
  const funderPublicKey = Keypair.fromSecret(funderSecretKey).publicKey();
  console.log(`[fund] Funder: ${funderPublicKey.substring(0, 8)}...`);

  try {
    const fromScVal = new Address(funderPublicKey).toScVal();
    const toScVal = new Address(address).toScVal();
    let lastError: any;

    for (const amountXlm of FUND_AMOUNTS_XLM) {
      try {
        console.log(`[fund] Funding ${address.substring(0, 8)}... with ${amountXlm} XLM`);

        const result: any = await contractInvoke({
          contractAddress: nativeToken.contract,
          secretKey: funderSecretKey,
          method: "transfer",
          args: [
            fromScVal,
            toScVal,
            nativeToScVal(amountXlm * 1e7, { type: "i128" }),
          ],
        });

        console.log(`[fund] Funded ${address.substring(0, 8)}... with ${amountXlm} XLM`);
        return NextResponse.json({
          ...result,
          fundedAmountXlm: amountXlm,
        });
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[fund] Funding ${address.substring(0, 8)}... with ${amountXlm} XLM failed:`,
          error?.message ?? error
        );
      }
    }

    throw lastError ?? new Error("Funding failed for all fallback amounts");
  } catch (error: any) {
    console.error(`[fund] Failed to fund ${address.substring(0, 8)}...:`, error?.message ?? error);
    return NextResponse.json(
      { error: "Funding failed", message: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
