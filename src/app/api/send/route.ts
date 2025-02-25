import { NextRequest, NextResponse } from 'next/server';

import { server } from '@/lib/passkeyServer';

export async function POST(req: NextRequest) {
    try {
        const { xdr } = await req.json();
        const res = await server.send(xdr);
        return NextResponse.json(res);
    } catch (error) {
        return NextResponse.json(error, { status: 500 });
    }
}
