import { NextRequest, NextResponse } from 'next/server';
import {
  Address,
  Contract,
  TransactionBuilder,
  Account,
} from '@stellar/stellar-sdk-v14';
import { Server, Api } from '@stellar/stellar-sdk-v14/rpc';
import { activeChain } from '@/lib/chain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Burn address used as a dummy source for read-only simulations
const DUMMY_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

const server = new Server(activeChain.sorobanRpcUrl!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const contract = searchParams.get('contract');

  if (!address || !contract) {
    return NextResponse.json(
      { error: 'address and contract query params are required' },
      { status: 400 }
    );
  }

  try {
    const source = new Account(DUMMY_SOURCE, '0');
    const tokenContract = new Contract(contract);
    const addressScVal = new Address(address).toScVal();

    const tx = new TransactionBuilder(source, {
      fee: '100',
      networkPassphrase: activeChain.networkPassphrase,
    })
      .addOperation(tokenContract.call('balance', addressScVal))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);

    if (Api.isSimulationError(simulated)) {
      // No balance entry — address likely has 0 balance
      return NextResponse.json({ balance: '0' });
    }

    const retval = simulated.result?.retval;
    if (!retval) {
      return NextResponse.json({ balance: '0' });
    }

    // Parse i128 from retval — returns BigInt
    const { scValToBigInt } = await import('@stellar/stellar-sdk-v14');
    const balance = scValToBigInt(retval);
    return NextResponse.json({ balance: balance.toString() });
  } catch (error: any) {
    console.error('[token-balance] error:', error?.message ?? error);
    return NextResponse.json({ balance: '0' });
  }
}
