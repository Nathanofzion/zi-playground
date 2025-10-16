import { NextRequest, NextResponse } from 'next/server';
// Change to relative path temporarily
import { stellarServer } from '../../../lib/stellar-server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { publicKey, amount = 10000 } = await req.json();
    
    console.log('🚀 Fund account request:', { 
      publicKey: publicKey?.substring(0, 8) + '...', 
      amount 
    });

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' }, 
        { status: 400 }
      );
    }

    // Validate using server-side Stellar SDK
    const isValid = await stellarServer.validatePublicKey(publicKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid public key format' }, 
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await stellarServer.getAccount(publicKey);
    
    if (existingAccount) {
      return NextResponse.json({
        success: true,
        message: 'Account already exists and is funded',
        data: {
          publicKey,
          balance: existingAccount.balances?.[0]?.balance || '0',
          alreadyExists: true
        }
      });
    }

    // Fund via Friendbot
    const fundingResult = await stellarServer.fundAccountViaFriendbot(publicKey);
    
    return NextResponse.json({
      success: true,
      message: 'Account created and funded successfully',
      data: {
        publicKey,
        amount: '10000.0000000',
        transactionHash: fundingResult.hash || 'N/A'
      }
    });

  } catch (error: any) {
    console.error('❌ Fund account error:', error);
    
    return NextResponse.json({
      error: 'Account funding failed',
      message: error.message,
      code: 'FUND_ACCOUNT_ERROR'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Fund account API is running'
  });
}