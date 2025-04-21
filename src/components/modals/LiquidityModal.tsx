import { FC } from "react";

import { Heading, Tabs } from "@chakra-ui/react";

import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import AddLiquidity from "../common/AddLiquidity";
import { ModalProps } from "../common/Modal";
import RemoveLiquidity from "../common/RemoveLiquidity";

const LiquidityModal: FC<ModalProps> = (props) => {
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
            <Tabs.Trigger px={4} value="remove_liquidity">
              Remove liquidity
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="add_liquidity">
            <AddLiquidity />
          </Tabs.Content>
          <Tabs.Content value="remove_liquidity">
            <RemoveLiquidity />
          </Tabs.Content>
        </Tabs.Root>
      </ModalContent>
    </Modal>
  );
};

export default LiquidityModal;
