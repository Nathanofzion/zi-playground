import { NextRequest, NextResponse } from "next/server";
import { stellarServer } from '@/lib/stellar-server-only';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Whitelist of valid game action IDs defined in the smart contract
const VALID_ACTIONS = new Set([1, 2, 3]);
// Minimum seconds between claims per wallet
const COOLDOWN_SECONDS = 60;

const airdropContractId = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ID;
const funderSecretKey = process.env.FUNDER_SECRET_KEY;

async function getContractInvoke() {
  const { contractInvoke } = await import('@/lib/contract');
  return { contractInvoke };
}

export async function POST(req: NextRequest) {
  // P01: Require authenticated user
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

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

    // Tamper.1 fix: whitelist valid action values
    const parsedAction = parseInt(action);
    if (!VALID_ACTIONS.has(parsedAction)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be 1, 2, or 3.' },
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

    // Rate-limit: one claim per wallet per COOLDOWN_SECONDS using Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const cutoff = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentClaim } = await supabase
      .from('rewards')
      .select('created_at')
      .eq('user_id', auth.id)
      .gte('created_at', cutoff)
      .limit(1)
      .single();

    if (recentClaim) {
      return NextResponse.json(
        { error: `Cooldown active. You may claim at most once every ${COOLDOWN_SECONDS} seconds.` },
        { status: 429 }
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

    // Suppress secret key from error logs — do not log `funderSecretKey`

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
    // Intentionally omit full error internals to avoid leaking contract state
    console.error('[airdrop] error:', error?.message ?? 'unknown');
    
    return NextResponse.json({
      error: 'Airdrop failed',
      message: error.message,
      code: 'AIRDROP_ERROR'
    }, { status: 500 });
  }
}