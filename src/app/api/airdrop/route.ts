import { NextRequest, NextResponse } from "next/server";
import { stellarServer } from '@/lib/stellar-server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID;
const funderSecretKey = process.env.FUNDER_SECRET_KEY;

async function getContractInvoke() {
  const { contractInvoke } = await import('@/lib/contract');
  return { contractInvoke };
}

export async function POST(req: NextRequest) {
  try {
    const { address, action = 1 } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: 'address is required' },
        { status: 400 }
      );
    }

    // Validate address using server-side SDK
    const isValid = await stellarServer.validatePublicKey(address);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    if (!airdropContractId || !funderSecretKey) {
      return NextResponse.json(
        { error: 'Contract not configured' },
        { status: 500 }
      );
    }

    const { contractInvoke } = await getContractInvoke();

    // Convert values using server-side SDK
    const recipientScVal = await stellarServer.nativeToScVal(address);
    const actionScVal = await stellarServer.nativeToScVal(parseInt(action));

    const result = await contractInvoke({
      contractAddress: airdropContractId,
      secretKey: funderSecretKey,
      method: "distribute_tokens",
      args: [recipientScVal, actionScVal],
    });

    return NextResponse.json({
      success: true,
      message: 'Airdrop tokens distributed successfully',
      data: {
        ...result,
        recipient: address,
        action: parseInt(action)
      }
    });

  } catch (error: any) {
    console.error('❌ Airdrop error:', error);
    
    return NextResponse.json({
      error: 'Airdrop failed',
      message: error.message,
      code: 'AIRDROP_ERROR'
    }, { status: 500 });
  }
}