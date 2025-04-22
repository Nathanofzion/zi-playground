import { useEffect, useMemo, useRef, useState } from "react";

import { Spinner, VStack } from "@chakra-ui/react";
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

const RemoveLiquidity = () => {
  const { address } = useSorobanReact();
  const { assets } = useAssets();
  const { pairs } = usePairs();
  const [pairId, setPairId] = useState<number | null>(null);
  const [lpAmount, setLPAmount] = useState("0");
  const [amount1, setAmount1] = useState("0");
  const [amount2, setAmount2] = useState("0");
  const timerRef = useRef<any | null>(null);

  const pair = useMemo(
    () => pairs.find((pair) => pair.id == pairId),
    [pairs, pairId]
  );

  const { asset1, asset2 } = useMemo(() => {
    let asset1 =
      assets.find((asset) => asset.contract == pair?.token_a) ?? null;
    let asset2 =
      assets.find((asset) => asset.contract == pair?.token_b) ?? null;
    if (asset1 && asset2) {
      return { asset1, asset2 };
    }
    asset1 = assets.find((asset) => asset.contract == pair?.token_b) ?? null;
    asset2 = assets.find((asset) => asset.contract == pair?.token_a) ?? null;
    return { asset1, asset2 };
  }, [assets, pair]);

  const { calculateAmount, isRemoving, removeLiquidity } =
    useLiquidity(asset1, asset2);

  const refetchAmount = async () => {
    if (!address || !asset1 || !asset2 || !pair) return;
    const [amount1, amount2] = await calculateAmount(lpAmount);
    setAmount1(formatBalance(amount1, asset1.decimals));
    setAmount2(formatBalance(amount2, asset2.decimals));
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
      await removeLiquidity(lpAmount);
      toaster.create({
        title: "You have added liquidity successfully!",
        type: "success",
      });
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
