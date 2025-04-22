import { FC } from "react";

import { Flex, FlexProps, Image, Spinner, Text } from "@chakra-ui/react";

import { IAsset } from "@/interfaces";
import { formatNumber } from "@/utils";

const AssetCard: FC<FlexProps & { asset: IAsset & { balance: number } }> = ({
  asset,
  ...props
}) => {
  return (
    <Flex p={2} gap={2} rounded="md" cursor="pointer" {...props}>
      <Flex flex="1 1 0" gap={2}>
        <Image flex="none" h={10} alt={asset.code} src={asset.icon} />
        <Flex direction="column" justify="space-around">
          <Text maxW="120px" fontSize="small" truncate>
            {asset.name}
          </Text>
          <Text maxW="120px" fontSize="x-small" truncate>
            {asset.code} ({asset.domain})
          </Text>
        </Flex>
      </Flex>
      <Flex direction="column" justify="space-around">
        {asset.balance != undefined ? (
          <Text>{formatNumber(asset.balance, 2)}</Text>
        ) : (
          <Spinner size="sm" />
        )}
      </Flex>
    </Flex>
  );
};

export default AssetCard;
