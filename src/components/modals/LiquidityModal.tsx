import BigNumber from "bignumber.js";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import {
  Flex,
  Heading,
  HStack,
  Image,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";

import useAssets from "@/hooks/useAssets";
import useLiquidity from "@/hooks/useLiquidity";
import { formatBalance } from "@/utils";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import AssetSelect from "../common/AssetSelect";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

const LiquidityModal: FC<ModalProps> = (props) => {
  const { assets } = useAssets();
  const [assetId1, setAssetId1] = useState(0);
  const [assetId2, setAssetId2] = useState(1);
  const [amount1, setAmount1] = useState("0");
  const [amount2, setAmount2] = useState("0");
  const [lpAmount, setLPAmount] = useState("0");
  const timerRef = useRef<any | null>(null);

  const asset1 = useMemo(
    () => assets.find((_, index) => index == assetId1) ?? null,
    [assets, assetId1]
  );

  const asset2 = useMemo(
    () => assets.find((_, index) => index == assetId2) ?? null,
    [assets, assetId2]
  );

  const {
    decimals,
    reserves,
    balance,
    calculateLpAmount,
    isAdding,
    addLiquidity,
  } = useLiquidity(asset1, asset2);

  const refetchLpAmount = async () => {
    const lpAmount = await calculateLpAmount(amount1, amount2);
    setLPAmount(formatBalance(lpAmount, decimals));
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
          LIQUIDITY
        </Heading>
        <Tabs.Root defaultValue="add_liquidity">
          <Tabs.List>
            <Tabs.Trigger px={4} value="add_liquidity">
              Add liquidity
            </Tabs.Trigger>
            {/* <Tabs.Trigger px={4} value="remove_liquidity">
              Remove liquidity
            </Tabs.Trigger> */}
          </Tabs.List>
          <Tabs.Content value="add_liquidity">
            <VStack pt={4} align="stretch" gap={4}>
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
                      onChange={(e) =>
                        onChangeAmount(e.target.value, undefined)
                      }
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
                    <Input
                      value={amount2}
                      onChange={(e) =>
                        onChangeAmount(undefined, e.target.value)
                      }
                    />
                  </>
                )}
              </VStack>
              {asset1 && asset2 && (
                <VStack align="stretch">
                  <HStack>
                    <Flex>
                      <Image h="24px" alt="token_a" src={asset1.icon} />
                      <Image w="24px" ml={-2} alt="token_b" src={asset2.icon} />
                    </Flex>
                    <Input flexGrow={1} value={lpAmount} disabled />
                  </HStack>
                  Balance: {formatBalance(balance, decimals)}
                </VStack>
              )}
              <Button loading={isAdding} onClick={handleAddLiquidity}>
                Add liquidity
              </Button>
            </VStack>
          </Tabs.Content>
          {/* <Tabs.Content value="remove_liquidity">
            <VStack pt={4} align="stretch" gap={4}></VStack>
          </Tabs.Content> */}
        </Tabs.Root>
      </ModalContent>
    </Modal>
  );
};

export default LiquidityModal;
