import { NextRequest, NextResponse } from 'next/server';
import { Address, Keypair, nativeToScVal } from '@stellar/stellar-sdk-v14';
import { contractInvoke } from '@/lib/contract';
import zionToken from '@/constants/zionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

// 0.000001 ZI per point = 10 raw units (ZI has 7 decimals: 1e-6 * 1e7 = 10)
const ZI_STROOPS_PER_POINT = 10n;

// Maximum reward per game session: 10 ZI = 100_000_000 stroops
const MAX_ZI_REWARD = 100_000_000n;

export async function POST(req: NextRequest) {
  try {
    const { address, score } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }
    if (!score || typeof score !== 'number' || score <= 0) {
      return NextResponse.json({ error: 'score must be a positive number' }, { status: 400 });
    }

    const isGAddress = address.startsWith('G') && address.length === 56;
    const isCAddress = address.startsWith('C') && address.length === 56;
    if (!isGAddress && !isCAddress) {
      return NextResponse.json(
        { error: 'Invalid address format. Must be a valid G-address or C-address.' },
        { status: 400 }
      );
    }

    if (!funderSecretKey) {
      return NextResponse.json({ error: 'Reward funder not configured' }, { status: 500 });
    }

    // Calculate ZI amount — cap to prevent abuse
    const rawAmount = BigInt(Math.floor(score)) * ZI_STROOPS_PER_POINT;
    const clampedAmount = rawAmount > MAX_ZI_REWARD ? MAX_ZI_REWARD : rawAmount;

    const funderPublicKey = Keypair.fromSecret(funderSecretKey).publicKey();
    const fromScVal = new Address(funderPublicKey).toScVal();
    const toScVal = new Address(address).toScVal();
    const amountScVal = nativeToScVal(clampedAmount, { type: 'i128' });

    // Transfer ZI from funder to player via the ZI SAC
    const result = await contractInvoke({
      contractAddress: zionToken.contract,
      secretKey: funderSecretKey,
      method: 'transfer',
      args: [fromScVal, toScVal, amountScVal],
    });

    return NextResponse.json({
      success: true,
      message: 'Game reward distributed successfully',
      data: {
        recipient: address,
        score,
        ziRewarded: clampedAmount.toString(),
        ziRewardedFormatted: (Number(clampedAmount) / Math.pow(10, zionToken.decimals)).toFixed(7),
        ...(result as any),
      },
    });
  } catch (error: any) {
    console.error('[game-reward] error:', error?.message ?? 'unknown');
    return NextResponse.json(
      { error: 'Game reward failed', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

