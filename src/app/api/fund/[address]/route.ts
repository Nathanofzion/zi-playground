import { NextRequest, NextResponse } from 'next/server';

import { Keypair } from '@stellar/stellar-sdk';
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';

import { activeChain } from '@/lib/chain';
import { native } from '@/lib/passkeyClient';
import { server } from '@/lib/passkeyServer';

const funderSecretKey = process.env.FUNDER_SECRET_KEY!;

export async function GET(_: NextRequest, { params: { address } }: { params: { address: string; } }) {
  const fundKeypair = Keypair.fromSecret(funderSecretKey);
  const fundSigner = basicNodeSigner(fundKeypair, activeChain.networkPassphrase);
  const publicKey = fundKeypair.publicKey();

  try {
    const tx = await native.transfer({
      from: publicKey,
      to: address,
      amount: BigInt(25 * 1e7),
    });

    await tx.signAuthEntries({
      address: publicKey,
      signAuthEntry: (entry: any) => fundSigner.signAuthEntry(entry),
    });

    const response = await server.send(tx.toXDR());
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 500 });
  }
}
