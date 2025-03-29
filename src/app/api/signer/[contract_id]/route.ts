import { NextRequest, NextResponse } from "next/server";

import { server } from "@/lib/passkeyServer";

export async function GET(
  _: NextRequest,
  { params: { contract_id } }: { params: { contract_id: string } }
) {
  try {
    const signers = await server.getSigners(contract_id);
    const response = NextResponse.json(signers);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
