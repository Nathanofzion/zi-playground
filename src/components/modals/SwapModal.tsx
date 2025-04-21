import BigNumber from "bignumber.js";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { Heading, Text, VStack } from "@chakra-ui/react";
import { xdr } from "@stellar/stellar-sdk";

import useAssets from "@/hooks/useAssets";
import useSwap from "@/hooks/useSwap";
import { formatBalance } from "@/utils";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import AssetSelect from "../common/AssetSelect";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

export function strToScVal(base64Xdr: string): xdr.ScVal {
  return xdr.ScVal.fromXDR(Buffer.from(base64Xdr, "base64"));
}

const SwapModal: FC<ModalProps> = (props) => {
  const { assets } = useAssets();
  const [assetId1, setAssetId1] = useState(0);
  const [assetId2, setAssetId2] = useState(1);
  const [amount1, setAmount1] = useState("0");
  const [amount2, setAmount2] = useState("0");
  const timerRef = useRef<any | null>();

  const asset1 = useMemo(
    () => assets.find((_, index) => index == assetId1) ?? null,
    [assets, assetId1]
  );

  const asset2 = useMemo(
    () => assets.find((_, index) => index == assetId2) ?? null,
    [assets, assetId2]
  );

  const { isSwapping, swap, calculateAmount } = useSwap(asset1, asset2);

  const refetchLpAmount = async () => {
    if (!asset1 || !asset2) return;
    const lpAmount = await calculateAmount(amount1);
    setAmount2(formatBalance(lpAmount, asset2!.decimals));
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      refetchLpAmount();
    }, 500);
  }, [amount1]);

  const handleSwap = async () => {
    try {
      await swap(amount1);
      toaster.create({
        title: "You have swapped asset successfully!",
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
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          SWAP
        </Heading>
        <VStack align="stretch">
          <AssetSelect
            selectedAssetId={assetId1}
            onSelectAsset={(assetId) => setAssetId1(assetId)}
          />
          {asset1 && (
            <>
              {BigNumber(amount1).gt(asset1.balance) && (
                <Text color="red.500">Insufficient {asset1.code}</Text>
              )}
              <Input
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
              />
            </>
          )}
        </VStack>
        <VStack align="stretch">
          <AssetSelect
            selectedAssetId={assetId2}
            onSelectAsset={(assetId) => setAssetId2(assetId)}
          />
          {asset2 && (
            <>
              {BigNumber(amount1).gt(asset2.balance) && (
                <Text color="red.500">Insufficient {asset2.code}</Text>
              )}
              <Input value={amount2} disabled />
            </>
          )}
        </VStack>
        <Button loading={isSwapping} onClick={handleSwap}>
          Swap
        </Button>
      </ModalContent>
    </Modal>
  );
};

export default SwapModal;
