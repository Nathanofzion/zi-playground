// ❌ REMOVED: import { Address, Contract } from '@stellar/stellar-sdk';
// ❌ REMOVED: import { Spec as ContractSpec, i128, u64 } from '@stellar/stellar-sdk/contract';

export type Option<T> = T | undefined;

// ✅ Type definitions for router contract methods
export interface RouterAddLiquidityArgs {
    token_a: string,
    token_b: string,
    amount_a_desired: string | number | bigint,
    amount_b_desired: string | number | bigint,
    amount_a_min: string | number | bigint,
    amount_b_min: string | number | bigint,
    to: string,
    deadline: string | number | bigint,
}

export interface RouterSwapExactTokensForTokensArgs {
    amount_in: string | number | bigint,
    amount_out_min: string | number | bigint,
    path: string[],
    to: string,
    deadline: string | number | bigint,
}

export interface RouterRemoveLiquidityArgs {
    token_a: string,
    token_b: string,
    liquidity: string | number | bigint,
    amount_a_min: string | number | bigint,
    amount_b_min: string | number | bigint,
    to: string,
    deadline: string | number | bigint,
}

// ✅ API-based conversion utilities
async function convertToScVal(value: any, type?: string): Promise<any> {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'nativeToScVal', 
        value,
        options: type ? { type } : undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('convertToScVal error:', error);
    throw error;
  }
}

// ✅ RouterContract implementation using API calls
export class RouterContract {
  static spec = {
    // ✅ FIXED: Removed unused 'key' variable and improved method-specific conversion
    async funcArgsToScVals(methodName: string, args: any): Promise<any[]> {
      const scVals: any[] = [];
      
      try {
        switch (methodName) {
          case 'add_liquidity':
            scVals.push(await convertToScVal(args.token_a, 'address'));
            scVals.push(await convertToScVal(args.token_b, 'address'));
            scVals.push(await convertToScVal(args.amount_a_desired, 'i128'));
            scVals.push(await convertToScVal(args.amount_b_desired, 'i128'));
            scVals.push(await convertToScVal(args.amount_a_min, 'i128'));
            scVals.push(await convertToScVal(args.amount_b_min, 'i128'));
            scVals.push(await convertToScVal(args.to, 'address'));
            scVals.push(await convertToScVal(args.deadline, 'u64'));
            break;

          case 'remove_liquidity':
            scVals.push(await convertToScVal(args.token_a, 'address'));
            scVals.push(await convertToScVal(args.token_b, 'address'));
            scVals.push(await convertToScVal(args.liquidity, 'i128'));
            scVals.push(await convertToScVal(args.amount_a_min, 'i128'));
            scVals.push(await convertToScVal(args.amount_b_min, 'i128'));
            scVals.push(await convertToScVal(args.to, 'address'));
            scVals.push(await convertToScVal(args.deadline, 'u64'));
            break;

          case 'swap_exact_tokens_for_tokens':
            scVals.push(await convertToScVal(args.amount_in, 'i128'));
            scVals.push(await convertToScVal(args.amount_out_min, 'i128'));
            // Convert path array
            const pathScVals = await Promise.all(
              args.path.map((address: string) => convertToScVal(address, 'address'))
            );
            scVals.push(pathScVals);
            scVals.push(await convertToScVal(args.to, 'address'));
            scVals.push(await convertToScVal(args.deadline, 'u64'));
            break;

          default:
            // ✅ FIXED: Generic conversion without unused variables
            const argValues = Object.values(args);
            for (const value of argValues) {
              if (typeof value === 'string' && value.startsWith('G')) {
                // Stellar address
                scVals.push(await convertToScVal(value, 'address'));
              } else if (Array.isArray(value)) {
                // Array of values (like path)
                const arrayScVals = await Promise.all(
                  value.map((item: any) => convertToScVal(item))
                );
                scVals.push(arrayScVals);
              } else if (typeof value === 'bigint') {
                // BigInt values
                scVals.push(await convertToScVal(value.toString(), 'i128'));
              } else if (typeof value === 'number' && value > 1000000000) {
                // Large numbers (likely amounts or timestamps)
                scVals.push(await convertToScVal(value, 'i128'));
              } else {
                // Generic conversion
                scVals.push(await convertToScVal(value));
              }
            }
            break;
        }

        return scVals;
      } catch (error) {
        console.error(`funcArgsToScVals error for ${methodName}:`, error);
        throw error;
      }
    }
  };
}

// ✅ Utility functions
export function validateRouterArgs(methodName: string, args: any): boolean {
  switch (methodName) {
    case 'add_liquidity':
      return !!(args.token_a && args.token_b && args.to);
    case 'remove_liquidity':
      return !!(args.token_a && args.token_b && args.to && args.liquidity);
    case 'swap_exact_tokens_for_tokens':
      return !!(args.amount_in && args.path && args.to);
    default:
      return true;
  }
}

export function formatAmount(amount: string | number | bigint): string {
  if (typeof amount === 'bigint') {
    return amount.toString();
  }
  if (typeof amount === 'number') {
    return Math.floor(amount).toString();
  }
  return amount;
}

export function isValidAddress(address: string): boolean {
  return /^[GC][A-Z2-7]{55}$/.test(address);
}