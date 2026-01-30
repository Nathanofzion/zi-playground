import { useEffect, useMemo, useRef, useState } from "react";

import { Spinner, Text, VStack } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAssets from "@/hooks/useAssets";
import useLiquidity from "@/hooks/useLiquidity";
import usePairs from "@/hooks/usePairs";
import { formatBalance } from "@/utils";
import AssetCard from "../common/AssetCard";
import Input from "../common/Input";
import PairSelect from "../common/PairSelect";
import { toaster } from "../ui/toaster";
import Button from "./Button";
import BigNumber from "bignumber.js";

const RemoveLiquidity = () => {
  const { address } = useSorobanReact();
  const { assets } = useAssets();
  const [pairId, setPairId] = useState<number | null>(null);
  const [lpAmount, setLPAmount] = useState("0");
  const [amount1, setAmount1] = useState("0");
  const [amount2, setAmount2] = useState("0");
  const timerRef = useRef<any | null>(null);

  const { pair } = useLiquidity(
    assets[0],
    assets[1]
  );

  const { asset1, asset2 } = useMemo(() => {
    let asset1 =
      assets.find((asset) => asset.contract == pair?.token_0) ?? null;
    let asset2 =
      assets.find((asset) => asset.contract == pair?.token_1) ?? null;
    if (asset1 && asset2) {
      return { asset1, asset2 };
    }
    asset1 = assets.find((asset) => asset.contract == pair?.token_1) ?? null;
    asset2 = assets.find((asset) => asset.contract == pair?.token_0) ?? null;
    return { asset1, asset2 };
  }, [assets, pair]);

  const { calculateAmount, isRemoving, removeLiquidity , reserves } =
    useLiquidity(asset1, asset2);

  const refetchAmount = async () => {
    if (!address || !asset1 || !asset2 || !pair || !reserves || !lpAmount) return;
    // const [amount1, amount2] = await calculateAmount(lpAmount);

     // Convert lpAmount to raw value (multiply by 10^pair.decimals)
  const lpAmountRaw = parseFloat(lpAmount) * Math.pow(10, pair.decimals);
  
  // Convert total_supply to raw value
  const totalSupplyRaw = pair.total_supply * Math.pow(10, pair.decimals);
  
  // Calculate share using raw values
  const user_share = lpAmountRaw / totalSupplyRaw;
  
  // reserves are already raw, multiply by share and convert to decimal
  const amount1Raw = parseInt(reserves[0]) * user_share;
  const amount2Raw = parseInt(reserves[1]) * user_share;
  
  // Convert back to human-readable
  setAmount1((amount1Raw / Math.pow(10, asset1.decimals)).toString());
  setAmount2((amount2Raw / Math.pow(10, asset2.decimals)).toString());
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      refetchAmount();
    }, 500);
  }, [lpAmount]);

  const handleRemoveLiquidity = async () => {
    try {
      if(BigNumber(lpAmount).gt(pair?.balance!)){
        return;
      }
      await removeLiquidity(lpAmount);
      toaster.create({
        title: "You have removed liquidity successfully!",
        type: "success",
      });
      setAmount1("0");
      setAmount2("0");
      setLPAmount("0");
    } catch (err) {
      toaster.create({
        title: err instanceof Error ? err.message : (err as string),
        type: "error",
      });
    }
  };

  return (
    <VStack pt={4} align="stretch" gap={4}>
      <VStack align="stretch">
        <PairSelect
          selectedPairId={pairId}
          onSelectPair={(pairId) => setPairId(pairId)}
        />
        {pair && BigNumber(lpAmount).gt(pair.balance) && (
          <Text color="red.500">Insufficient Amount</Text>
        )}
        <Input value={lpAmount} onChange={(e) => setLPAmount(e.target.value)} />
      </VStack>
      <VStack align="stretch">
        {asset1 ? <AssetCard asset={asset1} /> : <Spinner size="sm" />}
        <Input value={amount1} disabled />
      </VStack>
      <VStack align="stretch">
        {asset2 ? <AssetCard asset={asset2} /> : <Spinner size="sm" />}
        <Input value={amount2} disabled />
      </VStack>
      <Button loading={isRemoving} onClick={handleRemoveLiquidity}>
        Remove liquidity
      </Button>
    </VStack>
  );
};

export default RemoveLiquidity;
