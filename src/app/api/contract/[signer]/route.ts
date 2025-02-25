import { NextRequest, NextResponse } from 'next/server';

import { server } from '@/lib/passkeyServer';

export async function GET(_: NextRequest, { params: { signer } }: { params: { signer: string; } }) {
    try {
        const contractId = await server.getContractId({
            keyId: signer,
        });
        return NextResponse.json(String(contractId));
    } catch (error) {
        return NextResponse.json(error, { status: 500 });
    }
}
