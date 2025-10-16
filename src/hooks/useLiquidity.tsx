import BigNumber from "bignumber.js";
import { useState } from "react";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
// ❌ REMOVED: import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { IAsset } from "@/interfaces";
import { RouterContract } from "@/app/api/lib/router-contract";

const routerContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_ROUTER!;
const factoryContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_FACTORY!;

// ✅ API-based conversion functions
async function nativeToScVal(value: any, options?: { type?: string }) {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'nativeToScVal', 
        value,
        options 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('nativeToScVal error:', error);
    throw error;
  }
}

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
      throw new Error(error.message || 'Conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('scValToNative error:', error);
    throw error;
  }
}

const useLiquidity = (asset1: IAsset | null, asset2: IAsset | null) => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data } = useQuery({
    queryKey: ["pair", asset1?.contract, asset2?.contract],
    queryFn: async () => {
      try {
        const asset1Address = await nativeToScVal(asset1!.contract, { type: "address" });
        const asset2Address = await nativeToScVal(asset2!.contract, { type: "address" });

        const result1 = await contractInvoke({
          contractAddress: factoryContractAddress,
          method: "get_pair",
          args: [asset1Address, asset2Address],
          sorobanContext,
        });

        const contract = await scValToNative(result1) as string;

        const result2 = await contractInvoke({
          contractAddress: contract,
          method: "get_reserves",
          sorobanContext,
        });

        const reserves = await scValToNative(result2);

        return {
          contract,
          reserves,
        };
      } catch (error) {
        console.error('Pair query error:', error);
        throw error;
      }
    },
    enabled: !!asset1 && !!asset2,
  });

  const contract = data?.contract;
  const reserves = (() => {
    if (!asset1 || !asset2 || !data) return null;
    if (asset1.contract < asset2.contract)
      return [data.reserves[0], data.reserves[1]];
    return [data.reserves[1], data.reserves[0]];
  })();

  const addLiquidity = async (
    amount_a: string,
    amount_b: string,
    signAndSend: boolean | undefined = true
  ) => {
    if (!address) {
      throw new Error("Wallet is not connected yet!");
    }

    if (!asset1 || !asset2) {
      throw new Error("Please select pair to add liquidity!");
    }

    try {
      setIsAdding(true);

      // ✅ FIX: Await the conversion before passing to contractInvoke
      const args = await RouterContract.spec.funcArgsToScVals("add_liquidity", {
        token_a: asset1.contract,
        token_b: asset2.contract,
        amount_a_desired: BigNumber(amount_a).times(10000000).toFixed(0),
        amount_b_desired: BigNumber(amount_b).times(10000000).toFixed(0),
        amount_a_min: 0,
        amount_b_min: 0,
        to: address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      });

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "add_liquidity",
        args, // ✅ Now this is a resolved ScVal[] array
        signAndSend,
        sorobanContext,
        reconnectAfterTx: false,
      });

      if (signAndSend) {
        queryClient.invalidateQueries({
          queryKey: ["balance", address, contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset1.contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset2.contract],
        });
      } else {
        return await scValToNative(result);
      }
    } catch (error) {
      console.error('Add liquidity error:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const calculateLpAmount = async (amount1: string, amount2: string) => {
    try {
      const simulated = await addLiquidity(amount1, amount2, false);
      return simulated[2];
    } catch (error) {
      console.error('Calculate LP amount error:', error);
      throw error;
    }
  };

  const removeLiquidity = async (
    amount: string,
    signAndSend: boolean | undefined = true
  ) => {
    if (!address) {
      throw new Error("Wallet is not connected yet!");
    }

    if (!asset1 || !asset2) {
      throw new Error("Please select pair to remove liquidity!");
    }

    try {
      setIsRemoving(true);

      // ✅ FIX: Await the conversion before passing to contractInvoke
      const args = await RouterContract.spec.funcArgsToScVals("remove_liquidity", {
        token_a: asset1.contract,
        token_b: asset2.contract,
        liquidity: BigNumber(amount).times(10000000).toFixed(0),
        amount_a_min: 0,
        amount_b_min: 0,
        to: address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      });

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "remove_liquidity",
        args, // ✅ Now this is a resolved ScVal[] array
        signAndSend,
        sorobanContext,
        reconnectAfterTx: false,
      });

      if (signAndSend) {
        queryClient.invalidateQueries({
          queryKey: ["balance", address, contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset1.contract],
        });

        queryClient.invalidateQueries({
          queryKey: ["balance", address, asset2.contract],
        });
      } else {
        return await scValToNative(result);
      }
    } catch (error) {
      console.error('Remove liquidity error:', error);
      throw error;
    } finally {
      setIsRemoving(false);
    }
  };

  const calculateAmount = async (amount: string) => {
    try {
      const simulated = await removeLiquidity(amount, false);
      return simulated;
    } catch (error) {
      console.error('Calculate amount error:', error);
      throw error;
    }
  };

  return {
    address,
    reserves,
    calculateLpAmount,
    isAdding,
    addLiquidity,
    calculateAmount,
    isRemoving,
    removeLiquidity,
  };
};

export default useLiquidity;