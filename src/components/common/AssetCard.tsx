import { FC } from "react";

import { Flex, FlexProps, Image, Spinner, Text } from "@chakra-ui/react";
import { Asset } from "@stellar-asset-lists/sdk";

const AssetCard: FC<FlexProps & { asset: Asset & { balance: number } }> = ({
  asset,
  ...props
}) => {
  return (
    <Flex
      p={2}
      gap={2}
      rounded="md"
      cursor="pointer"
      _hover={{
        bg: "rgba(255, 255, 255, 0.15)",
      }}
      {...props}
    >
      <Flex flex="1 1 0" gap={2}>
        <Image flex="none" w={10} h={10} alt={asset.code} src={asset.icon} />
        <Flex direction="column" justify="space-around">
          <Text maxW="120px" fontSize="small" truncate>
            {asset.name}
          </Text>
          <Text fontSize="x-small">
            {asset.code} ({asset.domain})
          </Text>
        </Flex>
      </Flex>
      <Flex direction="column" justify="space-around">
        {asset.balance != undefined ? (
          <Text>{asset.balance}</Text>
        ) : (
          <Spinner size="sm" />
        )}
      </Flex>
    </Flex>
  );
};

export default AssetCard;
