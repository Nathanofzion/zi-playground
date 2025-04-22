import BigNumber from "bignumber.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { Spinner, Text, VStack } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import useAssets from "@/hooks/useAssets";
import useLiquidity from "@/hooks/useLiquidity";
import usePairs from "@/hooks/usePairs";
import { formatBalance } from "@/utils";
import AssetSelect from "../common/AssetSelect";
import Button from "../common/Button";
import Input from "../common/Input";
import PairCard from "../common/PairCard";
import { toaster } from "../ui/toaster";

const AddLiquidity = () => {
  const { address } = useSorobanReact();
  const { assets } = useAssets();
  const { pairs } = usePairs();
  const [assetId1, setAssetId1] = useState<string | null>(null);
  const [assetId2, setAssetId2] = useState<string | null>(null);
  const [amount1, setAmount1] = useState("0");
  const [amount2, setAmount2] = useState("0");
  const [lpAmount, setLPAmount] = useState("0");
  const timerRef = useRef<any | null>(null);

  const asset1 = useMemo(
    () => assets.find((asset) => asset.id == assetId1) ?? null,
    [assets, assetId1]
  );

  const asset2 = useMemo(
    () => assets.find((asset) => asset.id == assetId2) ?? null,
    [assets, assetId2]
  );

  const pair = useMemo(
    () =>
      pairs.find(
        ({ token_a, token_b }) =>
          (token_a == asset1?.contract && token_b == asset2?.contract) ||
          (token_b == asset1?.contract && token_a == asset2?.contract)
      ) ?? null,
    [pairs, asset1, asset2]
  );

  const { reserves, calculateLpAmount, isAdding, addLiquidity } = useLiquidity(
    asset1,
    asset2
  );

  const onChangeAmount = (
    amount1: string | undefined,
    amount2: string | undefined
  ) => {
    if (!asset1 && !asset2) {
      return;
    }
    if (amount1 != undefined) {
      setAmount1(amount1);
      if (reserves) {
        const amount2 = BigNumber(amount1)
          .times(reserves[1])
          .div(reserves[0])
          .toString();
        setAmount2(amount2);
      }
    }
    if (amount2 != undefined) {
      setAmount2(amount2);
      if (reserves) {
        const amount1 = BigNumber(amount2)
          .times(reserves[0])
          .div(reserves[1])
          .toString();
        setAmount1(amount1);
      }
    }
  };

  const refetchLpAmount = async () => {
    if (!address || !asset1 || !asset2 || !pair) return;
    const lpAmount = await calculateLpAmount(amount1, amount2);
    setLPAmount(formatBalance(lpAmount, pair.decimals));
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      refetchLpAmount();
    }, 500);
  }, [amount1, amount2]);

  const handleAddLiquidity = async () => {
    try {
      await addLiquidity(amount1, amount2);
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
        <AssetSelect
          selectedAssetId={assetId1}
          onSelectAsset={(assetId) => setAssetId1(assetId)}
        />
        {asset1 && BigNumber(amount1).gt(asset1.balance) && (
          <Text color="red.500">Insufficient {asset1.code}</Text>
        )}
        <Input
          value={amount1}
          onChange={(e) => onChangeAmount(e.target.value, undefined)}
        />
      </VStack>
      <VStack align="stretch">
        <AssetSelect
          selectedAssetId={assetId2}
          onSelectAsset={(assetId) => setAssetId2(assetId)}
        />
        {asset2 && BigNumber(amount2).gt(asset2.balance) && (
          <Text color="red.500">Insufficient {asset2.code}</Text>
        )}
        <Input
          value={amount2}
          onChange={(e) => onChangeAmount(undefined, e.target.value)}
        />
      </VStack>
      {pair ? (
        <VStack align="stretch">
          <PairCard pair={pair} />
          <Input value={lpAmount} disabled />
        </VStack>
      ) : (
        <Spinner size="sm" />
      )}
      <Button loading={isAdding} onClick={handleAddLiquidity}>
        Add liquidity
      </Button>
    </VStack>
  );
};

export default AddLiquidity;
