import { FC, useMemo } from "react";

import { Flex, FlexProps, Image, Spinner, Text } from "@chakra-ui/react";

import useAssets from "@/hooks/useAssets";
import { IPair } from "@/interfaces";
import { formatNumber } from "@/utils";

const PairCard: FC<FlexProps & { pair: IPair & { balance: number } }> = ({
  pair,
  ...props
}) => {
  const { assets } = useAssets();

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

  return (
    <Flex p={2} gap={2} rounded="md" cursor="pointer" {...props}>
      <Flex flex="1 1 0" gap={2}>
        {asset1 && asset2 && (
          <Flex flex="none">
            <Image flex="none" h={8} alt={asset1.code} src={asset1.icon} />
            <Image
              ml={-4}
              flex="none"
              h={8}
              alt={asset2.code}
              src={asset2.icon}
            />
          </Flex>
        )}
        <Flex direction="column" justify="space-around">
          <Text maxW="120px" fontSize="small" truncate>
            {pair.name}
          </Text>
          <Text maxW="120px" fontSize="x-small" truncate>
            {pair.code}
          </Text>
        </Flex>
      </Flex>
      <Flex direction="column" justify="space-around">
        {pair.balance != undefined ? (
          <Text>{formatNumber(pair.balance, 2)}</Text>
        ) : (
          <Spinner size="sm" />
        )}
      </Flex>
    </Flex>
  );
};

export default PairCard;
