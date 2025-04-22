import BigNumber from "bignumber.js";
import { useState } from "react";

import { contractInvoke } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { useQueryClient } from "@tanstack/react-query";

import { IAsset } from "@/interfaces";
import { RouterContract } from "@/lib/router-contract";

const routerContractAddress = process.env.NEXT_PUBLIC_SOROSWAP_ROUTER!;

const useSwap = (asset1: IAsset | null, asset2: IAsset | null) => {
  const queryClient = useQueryClient();
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const [isSwapping, setIsSwapping] = useState(false);

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

      const result = await contractInvoke({
        contractAddress: routerContractAddress,
        method: "swap_exact_tokens_for_tokens",
        args: RouterContract.spec.funcArgsToScVals(
          "swap_exact_tokens_for_tokens",
          {
            amount_in: BigNumber(amount).times(10000000).toFixed(0),
            amount_out_min: 0,
            path: [asset1.contract, asset2.contract],
            to: address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
          }
        ),
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
      } else {
        return scValToNative(result as xdr.ScVal);
      }
    } finally {
      setIsSwapping(false);
    }
  };

  const calculateAmount = async (amount: string) => {
    const simulated = await swap(amount, false);
    return simulated[1];
  };

  return { calculateAmount, isSwapping, swap };
};

export default useSwap;
