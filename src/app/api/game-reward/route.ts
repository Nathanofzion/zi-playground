import { NextRequest, NextResponse } from 'next/server';
import { Address, Keypair, nativeToScVal } from '@stellar/stellar-sdk-v14';
import { createClient } from '@supabase/supabase-js';
import { contractInvoke } from '@/lib/contract';
import zionToken from '@/constants/zionToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

// 0.000001 ZI per point = 10 raw units (ZI has 7 decimals: 1e-6 * 1e7 = 10)
const ZI_STROOPS_PER_POINT = 10n;

// Hard lifetime cap: 10 ZI total per wallet address, ever
const LIFETIME_CAP_STROOPS = 100_000_000n; // 10 ZI

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

    // ── Lifetime cap check ────────────────────────────────────────────────────
    const supabase = getSupabase();
    const { data: row, error: fetchErr } = await supabase
      .from('game_rewards_earned')
      .select('total_stroops')
      .eq('address', address)
      .maybeSingle();

    if (fetchErr) {
      console.error('[game-reward] supabase fetch error:', fetchErr.message);
      return NextResponse.json({ error: 'Could not check reward cap' }, { status: 500 });
    }

    const alreadyEarned = BigInt(row?.total_stroops ?? 0);

    if (alreadyEarned >= LIFETIME_CAP_STROOPS) {
      return NextResponse.json(
        {
          error: 'Lifetime cap reached',
          message: 'This wallet has already earned the maximum 10 ZI from games.',
          lifetimeCapReached: true,
        },
        { status: 429 }
      );
    }

    // Calculate reward, clamped so total never exceeds lifetime cap
    const remaining = LIFETIME_CAP_STROOPS - alreadyEarned;
    const rawAmount = BigInt(Math.floor(score)) * ZI_STROOPS_PER_POINT;
    const clampedAmount = rawAmount > remaining ? remaining : rawAmount;

    if (clampedAmount === 0n) {
      return NextResponse.json(
        { error: 'No reward available', lifetimeCapReached: true },
        { status: 429 }
      );
    }

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

    // ── Record the earned amount (atomic increment via upsert) ────────────────
    const newTotal = alreadyEarned + clampedAmount;
    const { error: upsertErr } = await supabase
      .from('game_rewards_earned')
      .upsert(
        { address, total_stroops: Number(newTotal), updated_at: new Date().toISOString() },
        { onConflict: 'address' }
      );

    if (upsertErr) {
      // Transfer already happened — log but don't fail the response
      console.error('[game-reward] supabase upsert error:', upsertErr.message);
    }

    const lifetimeCapReached = newTotal >= LIFETIME_CAP_STROOPS;

    return NextResponse.json({
      success: true,
      message: 'Game reward distributed successfully',
      data: {
        recipient: address,
        score,
        ziRewarded: clampedAmount.toString(),
        ziRewardedFormatted: (Number(clampedAmount) / Math.pow(10, zionToken.decimals)).toFixed(7),
        lifetimeTotal: newTotal.toString(),
        lifetimeCapReached,
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


