import { NextRequest, NextResponse } from "next/server";

import { server } from "@/lib/passkeyServer";

// Next 15: GET route handlers are uncached by default. This is a live passkey
// lookup that must never be cached — make it explicit.
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, props: { params: Promise<{ signer: string }> }) {
  const params = await props.params;

  const {
    signer
  } = params;

  try {
    const contractId = await server.getContractId({
      keyId: signer,
    });
    return NextResponse.json({ contractId });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
