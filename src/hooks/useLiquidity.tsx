import BigNumber from "bignumber.js";
import { useState } from "react";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { IAsset } from "@/interfaces";
import { RouterContract } from "@/lib/router-contract";

const routerContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_ROUTER!;
const factoryContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_FACTORY!;

const useLiquidity = (asset1: IAsset | null, asset2: IAsset | null) => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data } = useQuery({
    queryKey: ["pair", asset1?.contract, asset2?.contract],
    queryFn: async () => {
      const result1 = await contractInvoke({
        contractAddress: factoryContractAddress,
        method: "get_pair",
        args: [
          nativeToScVal(asset1!.contract, { type: "address" }),
          nativeToScVal(asset2!.contract, { type: "address" }),
        ],
        sorobanContext,
      });

      const contract = scValToNative(result1 as xdr.ScVal) as string;

      const result2 = await contractInvoke({
        contractAddress: contract,
        method: "decimals",
        sorobanContext,
      });

      const decimals = scValToNative(result2 as xdr.ScVal);

      const result3 = await contractInvoke({
        contractAddress: contract,
        method: "get_reserves",
        sorobanContext,
      });

      const reserves = scValToNative(result3 as xdr.ScVal);

      return {
        contract,
        decimals,
        reserves,
      };
    },
    enabled: !!asset1 && !!asset2,
  });

  const contract = data?.contract;
  const decimals = data?.decimals;
  const reserves = (() => {
    if (!asset1 || !asset2 || !data) return null;
    if (asset1.contract < asset2.contract)
      return [data.reserves[0], data.reserves[1]];
    return [data.reserves[1], data.reserves[0]];
  })();

  const { data: balance } = useQuery({
    queryKey: ["balance", address, contract],
    queryFn: async () => {
      if (!contract || !decimals) return;

      const result3 = await contractInvoke({
        contractAddress: contract,
        method: "balance",
        args: [nativeToScVal(address, { type: "address" })],
        sorobanContext,
      });

      return scValToNative(result3 as xdr.ScVal);
    },
    enabled: !!contract,
  });

  const addLiquidity = async (
    amount_a: string | number,
    amount_b: string | number,
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

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "add_liquidity",
        args: RouterContract.spec.funcArgsToScVals("add_liquidity", {
          token_a: asset1.contract,
          token_b: asset2.contract,
          amount_a_desired: BigNumber(amount_a).times(10000000).toFixed(0),
          amount_b_desired: BigNumber(amount_b).times(10000000).toFixed(0),
          amount_a_min: 0,
          amount_b_min: 0,
          to: address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        }),
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
        return scValToNative(result as xdr.ScVal);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const calculateLpAmount = async (amount1: string, amount2: string) => {
    const simulated = await addLiquidity(amount1, amount2, false);
    return simulated[2];
  };

  return {
    address,
    decimals,
    reserves,
    balance,
    calculateLpAmount,
    isAdding,
    addLiquidity,
  };
};

export default useLiquidity;
