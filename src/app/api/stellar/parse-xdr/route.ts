import { NextRequest, NextResponse } from 'next/server';
import { stellarServer } from '@/lib/stellar-server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { base64Xdr } = await req.json();
    
    if (!base64Xdr) {
      return NextResponse.json(
        { error: 'Missing base64Xdr parameter' }, 
        { status: 400 }
      );
    }

    const result = await stellarServer.parseXdr(base64Xdr);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ XDR parsing error:', error);
    
    return NextResponse.json({
      error: 'XDR parsing failed',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'XDR parsing API is running'
  });
}