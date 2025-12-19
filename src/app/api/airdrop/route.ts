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

    // Validate address - support both G-address (traditional) and C-address (smart contract)
    const isGAddress = address.startsWith('G') && address.length === 56;
    const isCAddress = address.startsWith('C') && address.length === 56;
    
    if (!isGAddress && !isCAddress) {
      return NextResponse.json(
        { error: 'Invalid address format. Must be a valid G-address or C-address (56 characters, starting with G or C)' },
        { status: 400 }
      );
    }
    
    // For G-addresses, validate using server-side SDK
    if (isGAddress) {
      const isValid = await stellarServer.validatePublicKey(address);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid G-address format' },
          { status: 400 }
        );
      }
    }
    // C-addresses are contract addresses, no need for additional validation beyond format

    if (!airdropContractId || !funderSecretKey) {
      return NextResponse.json(
        { error: 'Contract not configured' },
        { status: 500 }
      );
    }

    const { contractInvoke } = await getContractInvoke();

    // Convert values using server-side SDK
    const recipientScVal = await stellarServer.nativeToScValAddress(address);
    const actionScVal = await stellarServer.nativeToScValU32(parseInt(action));

    const result = await contractInvoke({
      contractAddress: airdropContractId,
      secretKey: funderSecretKey,
      method: "distribute_reward",
      args: [recipientScVal, actionScVal],
    });

    return NextResponse.json({
      success: true,
      message: 'Airdrop tokens distributed successfully',
      data: {
        ...(result as any),
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