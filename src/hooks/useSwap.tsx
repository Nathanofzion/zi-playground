import BigNumber from "bignumber.js";
import { useState } from "react";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
// ❌ REMOVED: import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { useQueryClient } from "@tanstack/react-query";

import { IAsset } from "@/interfaces";
import { RouterContract } from "@/app/api/lib/router-contract";
import * as StellarSdk from "@stellar/stellar-sdk";

const routerContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_ROUTER!;

// ✅ API-based conversion function
async function scValToNative(scVal: any) {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'scValToNative', 
        scVal 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ScVal conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('scValToNative error:', error);
    throw error;
  }
}

const useSwap = (asset1: IAsset | null, asset2: IAsset | null) => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const [isSwapping, setIsSwapping] = useState(false);

  function i128FromDecimal(value: BigNumber.Value) {
    const bn = new BigNumber(value);
    const base = new BigNumber(2).pow(64);
    const lo = bn.modulo(base);
    const hi = bn.minus(lo).dividedBy(base);

    return StellarSdk.xdr.ScVal.scvI128(
      new StellarSdk.xdr.Int128Parts({
        hi: StellarSdk.xdr.Int64.fromString(hi.toFixed(0)),
        lo: StellarSdk.xdr.Uint64.fromString(lo.toFixed(0)),
      })
    );
  }

  const swap = async (
    amount: string,
    signAndSend: boolean | undefined = true
  ) => {
    if (!address) {
      throw new Error("Wallet is not connected yet!");
    }

    if (!asset1 || !asset2) {
      throw new Error("Please select asset to swap!");
    }

    try {
      setIsSwapping(true);

      // Pre-validate: simulate swap and check pool has enough liquidity
      const simulatedAmounts = await getAmountsOut(amount);
      if (!simulatedAmounts || !simulatedAmounts[1]) {
        throw new Error("Unable to calculate swap output. Pool may have insufficient liquidity.");
      }
      const expectedAmountOut = new BigNumber(simulatedAmounts[1]);
      if (expectedAmountOut.lte(0)) {
        throw new Error("Swap would return 0 tokens. Pool has insufficient liquidity.");
      }

      // 0.5% slippage tolerance
      const slippageTolerance = new BigNumber("0.995");
      const amountOutMin = expectedAmountOut.times(slippageTolerance).integerValue(BigNumber.ROUND_DOWN);

      const argsManual = [
        i128FromDecimal(new BigNumber(amount).times(1e7)),
        i128FromDecimal(amountOutMin),
        StellarSdk.xdr.ScVal.scvVec([
          new StellarSdk.Address(asset1.contract).toScVal(),
          new StellarSdk.Address(asset2.contract).toScVal(),
        ]),
        new StellarSdk.Address(address).toScVal(),
        StellarSdk.xdr.ScVal.scvU64(
          StellarSdk.xdr.Uint64.fromString(
            (Math.floor(Date.now() / 1000) + 1200).toString()
          )
        ),
      ]

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "swap_exact_tokens_for_tokens",
        // args, // ✅ Now this is a resolved ScVal[] array
        args: argsManual,
        signAndSend,
        sorobanContext,
        reconnectAfterTx: false,
      });

      console.log("Swap Result : ",result);
      

      if (signAndSend) {
        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset1.contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset2.contract],
        });

        return result;
      } else {
        // ✅ Use API-based conversion instead of direct Stellar SDK
        // return await scValToNative(result);
        return StellarSdk.scValToNative(result as any);
      }
    } catch (error) {
      console.error('Swap error:', error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  };

  const calculateAmount = async (amount: string) => {
    try {
      const simulated = await swap(amount, false);
      return simulated[1];
    } catch (error) {
      console.error('Calculate amount error:', error);
      throw error;
    }
  };

  // ✅ Additional swap utilities
  const swapTokensForExactTokens = async (
    amountOut: string,
    amountInMax: string,
    signAndSend: boolean | undefined = true
  ) => {
    if (!address) {
      throw new Error("Wallet is not connected yet!");
    }

    if (!asset1 || !asset2) {
      throw new Error("Please select asset to swap!");
    }

    try {
      setIsSwapping(true);

      const args = await RouterContract.spec.funcArgsToScVals(
        "swap_tokens_for_exact_tokens",
        {
          amount_out: BigNumber(amountOut).times(10000000).toFixed(0),
          amount_in_max: BigNumber(amountInMax).times(10000000).toFixed(0),
          path: [asset1.contract, asset2.contract],
          to: address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        }
      );

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "swap_tokens_for_exact_tokens",
        args,
        signAndSend,
        sorobanContext,
        reconnectAfterTx: false,
      });

      if (signAndSend) {
        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset1.contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset2.contract],
        });

        return result;
      } else {
        return await scValToNative(result);
      }
    } catch (error) {
      console.error('Swap tokens for exact tokens error:', error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  };

  const getAmountsOut = async (amountIn: string) => {
    if (!asset1 || !asset2) {
      throw new Error("Please select assets for swap calculation!");
    }

    try {
      const args = await RouterContract.spec.funcArgsToScVals(
        "router_get_amounts_out",
        {
          amount_in: BigNumber(amountIn).times(10000000).toFixed(0),
          path: [asset1.contract, asset2.contract],
        }
      );

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "router_get_amounts_out",
        args,
        signAndSend: false,
        sorobanContext,
      });

      return await scValToNative(result);
    } catch (error) {
      console.error('Get amounts out error:', error);
      throw error;
    }
  };

  const getAmountsIn = async (amountOut: string) => {
    if (!asset1 || !asset2) {
      throw new Error("Please select assets for swap calculation!");
    }

    try {
      const args = await RouterContract.spec.funcArgsToScVals(
        "router_get_amounts_in",
        {
          amount_out: BigNumber(amountOut).times(10000000).toFixed(0),
          path: [asset1.contract, asset2.contract],
        }
      );

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "router_get_amounts_in",
        args,
        signAndSend: false,
        sorobanContext,
      });

      return await scValToNative(result);
    } catch (error) {
      console.error('Get amounts in error:', error);
      throw error;
    }
  };

  // ✅ Utility functions
  const formatSwapAmount = (amount: string | number) => {
    return BigNumber(amount).times(10000000).toFixed(0);
  };

  const parseSwapResult = async (result: any) => {
    try {
      return await scValToNative(result);
    } catch (error) {
      console.error('Parse swap result error:', error);
      return null;
    }
  };

  const validateSwapParams = (amount: string) => {
    if (!amount || amount === '0') {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!asset1 || !asset2) {
      throw new Error('Both assets must be selected');
    }

    if (asset1.contract === asset2.contract) {
      throw new Error('Cannot swap the same asset');
    }

    return true;
  };

  return { 
    // ✅ Main swap functions
    calculateAmount, 
    isSwapping, 
    swap,
    swapTokensForExactTokens,
    
    // ✅ Quote functions
    getAmountsOut,
    getAmountsIn,
    
    // ✅ Utility functions
    formatSwapAmount,
    parseSwapResult,
    validateSwapParams,
    
    // ✅ Context data
    address,
    asset1,
    asset2,
  };
};

export default useSwap;